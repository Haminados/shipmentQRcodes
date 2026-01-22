// AuthSidecar/Program.cs
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// נזהה IP אמיתי מאחורי IIS/Proxy
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear(); o.KnownProxies.Clear();
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IDbConnection>(_ => new SqlConnection(builder.Configuration.GetConnectionString("Sql")));
builder.Services.AddSingleton<ISessionRepo, SessionRepo>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        var jwt = builder.Configuration.GetSection("Jwt");
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(jwt["AccessSecretB64"]!)),
            ValidateIssuer = true, ValidateAudience = true, ValidateIssuerSigningKey = true, ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();
var app = builder.Build();
app.UseForwardedHeaders();
app.UseHttpsRedirection();

// ============ /auth/login ============
// מנפיק Access קצר + Refresh ארוך, ושומר/מעדכן רשומת סשן ב-DB
app.MapPost("/auth/login", async (HttpContext http, ISessionRepo sessions, IJwtService jwt) =>
{
    // TODO: החלף ל-Windows Auth שלך / DB שלך.
    // לדוגמה: var domainUser = http.User.Identity?.Name; ומשם שליפת userId/role.
    var userId = 123;       // מזהה משתמש מה-AD/DB
    var role = "User";      // תפקיד נוכחי (ל-claim; החלטות הרשאה האמיתיות בצד ה-API)

    var sid = Guid.NewGuid();
    var ip  = NetUtil.RealClientIp(http);
    var ua  = http.Request.Headers.UserAgent.ToString();
    var did = http.Request.Cookies["__Host-did"] ?? Guid.NewGuid().ToString("N");

    var ipHash = Crypto.Sha256Hex(NetUtil.NormalizeIpPrefix(ip));
    var uaHash = Crypto.Sha256Hex(ua);

    // Access קצר (10–15 דק')
    var (access, _, accessExp) = jwt.CreateAccessToken(userId, role, sid.ToString(), did, ipHash, uaHash, TimeSpan.FromMinutes(15));
    // Refresh ארוך (30 יום)
    var (refresh, refreshJti)  = jwt.CreateRefreshToken(userId, TimeSpan.FromDays(30));

    // שמירת סשן ב-DB
    await sessions.UpsertAsync(new SessionRow {
        Sid = sid, UserId = userId,
        RefreshJti = refreshJti, RefreshHash = BCrypt.Net.BCrypt.HashPassword(refresh),
        DeviceId = did, IpHash = ipHash, UaHash = uaHash,
        Active = true, ExpiresAt = DateTime.UtcNow.AddDays(30)
    });

    // החזרת cookies מאובטחים
    CookieUtil.Set(http, "__Host-did", did,     httpOnly: true, secure: true, sameSite: "Lax", maxAge: TimeSpan.FromDays(365));
    CookieUtil.Set(http, "__Host-access", access, httpOnly: true, secure: true, sameSite: "Lax", maxAge: accessExp - DateTimeOffset.UtcNow);
    CookieUtil.Set(http, "__Host-refresh", refresh, httpOnly: true, secure: true, sameSite: "Lax", maxAge: TimeSpan.FromDays(30));

    return Results.Ok(new { ok = true });
});

// ============ /auth/refresh ============
// מאמת Refresh מול ה-DB, מבצע Rotation, ומנפיק Access חדש
app.MapPost("/auth/refresh", async (HttpContext http, ISessionRepo sessions, IJwtService jwt) =>
{
    if (!http.Request.Cookies.TryGetValue("__Host-refresh", out var refreshToken))
        return Results.Unauthorized();

    JwtSecurityToken payload;
    try { payload = jwt.ValidateRefresh(refreshToken); }
    catch { return Results.Unauthorized(); }

    var session = await sessions.GetByRefreshJtiAsync(payload.Id);
    if (session is null || !session.Active || session.ExpiresAt < DateTime.UtcNow)
        return Results.Unauthorized();

    // אימות Hash – מגן מגניבת refresh/reuse
    if (!BCrypt.Net.BCrypt.Verify(refreshToken, session.RefreshHash))
    {
        await sessions.DeactivateAsync(session.Sid); // בטל סשן במקרה חשד
        return Results.Unauthorized();
    }

    // איסוף fingerprints עדכניים
    var ip  = NetUtil.RealClientIp(http);
    var ua  = http.Request.Headers.UserAgent.ToString();
    var did = session.DeviceId ?? http.Request.Cookies["__Host-did"] ?? Guid.NewGuid().ToString("N");

    var ipHash = Crypto.Sha256Hex(NetUtil.NormalizeIpPrefix(ip));
    var uaHash = Crypto.Sha256Hex(ua);

    // אם צריך – שלוף role עדכני מה-DB/AD כאן (כדי "להכניס" שינוי הרשאות ברענון הבא)
    var role = "User";

    // Access חדש + Refresh חדש (Rotation)
    var (newAccess, _, accessExp) = jwt.CreateAccessToken(session.UserId, role, session.Sid.ToString(), did, ipHash, uaHash, TimeSpan.FromMinutes(15));
    var (newRefresh, newJti)      = jwt.CreateRefreshToken(session.UserId, TimeSpan.FromDays(30));

    await sessions.RotateAsync(session.Sid, newJti, BCrypt.Net.BCrypt.HashPassword(newRefresh), ipHash, uaHash, did);

    CookieUtil.Set(http, "__Host-access", newAccess, httpOnly: true, secure: true, sameSite: "Lax", maxAge: accessExp - DateTimeOffset.UtcNow);
    CookieUtil.Set(http, "__Host-refresh", newRefresh, httpOnly: true, secure: true, sameSite: "Lax", maxAge: TimeSpan.FromDays(30));

    return Results.Ok(new { ok = true });
});

app.Run();


// =================== Helpers & Services ===================

static class CookieUtil
{
    public static void Set(HttpContext ctx, string name, string value, bool httpOnly, bool secure, string sameSite, TimeSpan maxAge)
    {
        ctx.Response.Cookies.Append(name, value, new CookieOptions
        {
            HttpOnly = httpOnly,
            Secure = secure,
            SameSite = sameSite.Equals("Strict", StringComparison.OrdinalIgnoreCase) ? SameSiteMode.Strict : SameSiteMode.Lax,
            Path = "/",
            MaxAge = maxAge
        });
    }
    public static void Delete(HttpContext ctx, string name) => ctx.Response.Cookies.Delete(name, new CookieOptions { Path = "/" });
}

static class NetUtil
{
    public static string? RealClientIp(HttpContext http) =>
        http.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim()
        ?? http.Connection.RemoteIpAddress?.ToString();

    // מנרמל IPv4 ל-/24 כדי למנוע ניתוקים על שינויים קלים
    public static string NormalizeIpPrefix(string? ip)
    {
        if (string.IsNullOrWhiteSpace(ip)) return "";
        var parts = ip.Split('.');
        return parts.Length == 4 ? $"{parts[0]}.{parts[1]}.{parts[2]}.0/24" : ip;
    }
}

static class Crypto
{
    public static string Sha256Hex(string? s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        using var sha = SHA256.Create();
        return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(s))).ToLowerInvariant();
    }
}

// ----- DB Models & Repo -----
public record SessionRow
{
    public Guid Sid { get; set; }
    public int UserId { get; set; }
    public string RefreshJti { get; set; } = default!;
    public string RefreshHash { get; set; } = default!;
    public string? DeviceId { get; set; }
    public string? IpHash { get; set; }
    public string? UaHash { get; set; }
    public bool Active { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public interface ISessionRepo
{
    Task UpsertAsync(SessionRow s);
    Task<SessionRow?> GetByRefreshJtiAsync(string jti);
    Task RotateAsync(Guid sid, string newJti, string newHash, string ipHash, string uaHash, string did);
    Task DeactivateAsync(Guid sid);
}

public sealed class SessionRepo : ISessionRepo
{
    private readonly IDbConnection _db;
    public SessionRepo(IDbConnection db) { _db = db; }

    public async Task UpsertAsync(SessionRow s)
    {
        const string sql = @"
MERGE dbo.Sessions AS T
USING (SELECT @Sid Sid) AS S ON T.Sid = S.Sid
WHEN MATCHED THEN UPDATE SET
  RefreshJti=@RefreshJti, RefreshHash=@RefreshHash,
  DeviceId=@DeviceId, IpHash=@IpHash, UaHash=@UaHash,
  Active=@Active, ExpiresAt=@ExpiresAt, UserId=@UserId
WHEN NOT MATCHED THEN INSERT
 (Sid,UserId,RefreshJti,RefreshHash,DeviceId,IpHash,UaHash,Active,ExpiresAt)
VALUES (@Sid,@UserId,@RefreshJti,@RefreshHash,@DeviceId,@IpHash,@UaHash,@Active,@ExpiresAt);";
        await _db.ExecuteAsync(sql, s);
    }

    public Task<SessionRow?> GetByRefreshJtiAsync(string jti) =>
        _db.QuerySingleOrDefaultAsync<SessionRow>(
            "SELECT TOP 1 * FROM dbo.Sessions WHERE RefreshJti=@jti AND Active=1", new { jti });

    public Task RotateAsync(Guid sid, string newJti, string newHash, string ipHash, string uaHash, string did) =>
        _db.ExecuteAsync(@"UPDATE dbo.Sessions
SET RefreshJti=@newJti, RefreshHash=@newHash,
    IpHash=@ipHash, UaHash=@uaHash, DeviceId=@did
WHERE Sid=@sid AND Active=1",
            new { sid, newJti, newHash, ipHash, uaHash, did });

    public Task DeactivateAsync(Guid sid) =>
        _db.ExecuteAsync("UPDATE dbo.Sessions SET Active=0 WHERE Sid=@sid", new { sid });
}

// ----- JWT Service (Access + Refresh) -----
public interface IJwtService
{
    (string token, string jti, DateTimeOffset exp) CreateAccessToken(int userId, string role, string sid, string did, string ipHash, string uaHash, TimeSpan ttl);
    (string token, string jti) CreateRefreshToken(int userId, TimeSpan ttl);
    JwtSecurityToken ValidateRefresh(string token);
}

public sealed class JwtService : IJwtService
{
    private readonly IConfiguration _cfg;
    public JwtService(IConfiguration cfg) { _cfg = cfg; }

    public (string token, string jti, DateTimeOffset exp) CreateAccessToken(int userId, string role, string sid, string did, string ipHash, string uaHash, TimeSpan ttl)
    {
        var now = DateTimeOffset.UtcNow;
        var exp = now.Add(ttl);
        var jti = Guid.NewGuid().ToString("N");
        var key = new SymmetricSecurityKey(Convert.FromBase64String(_cfg["Jwt:AccessSecretB64"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim> {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new("role", role),
            new("sid", sid),
            new("did", did),
            new("ipHash", ipHash),
            new("uaHash", uaHash),
            new(JwtRegisteredClaimNames.Jti, jti)
        };

        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: exp.UtcDateTime,
            signingCredentials: creds
        );
        return (new JwtSecurityTokenHandler().WriteToken(token), jti, exp);
    }

    public (string token, string jti) CreateRefreshToken(int userId, TimeSpan ttl)
    {
        var now = DateTimeOffset.UtcNow;
        var exp = now.Add(ttl);
        var jti = Guid.NewGuid().ToString("N");
        var key = new SymmetricSecurityKey(Convert.FromBase64String(_cfg["Jwt:RefreshSecretB64"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim> {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Jti, jti)
        };

        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: exp.UtcDateTime,
            signingCredentials: creds
        );
        return (new JwtSecurityTokenHandler().WriteToken(token), jti);
    }

    public JwtSecurityToken ValidateRefresh(string token)
    {
        var parms = new TokenValidationParameters
        {
            ValidIssuer = _cfg["Jwt:Issuer"],
            ValidAudience = _cfg["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(_cfg["Jwt:RefreshSecretB64"]!)),
            ValidateIssuer = true, ValidateAudience = true, ValidateIssuerSigningKey = true, ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
        var handler = new JwtSecurityTokenHandler();
        handler.ValidateToken(token, parms, out var validated);
        return (JwtSecurityToken)validated;
    }
}