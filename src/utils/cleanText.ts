/**
 * CleanText function - replicates VBA logic:
 * Trim(Replace(Replace(txt, Chr(13), ""), Chr(7), ""))
 * 
 * Chr(13) = \r (carriage return)
 * Chr(7) = \x07 (bell character)
 * Also removes \n for safety
 * 
 * @param txt - Input text to clean
 * @returns Cleaned text with special characters removed and trimmed
 */
export function cleanText(txt: string): string {
  if (!txt) return '';
  
  return txt
    .replace(/\r/g, '')   // Remove carriage returns (Chr(13))
    .replace(/\n/g, '')   // Remove newlines
    .replace(/\x07/g, '') // Remove bell character (Chr(7))
    .trim();              // Trim whitespace from start/end
}
