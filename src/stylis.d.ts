declare module 'stylis' {
  export function prefixer(element: any, index: any, children: any, next: any): any;
}

declare module 'stylis-plugin-rtl' {
  const rtlPlugin: (element: any, index: any, children: any, next: any) => any;
  export default rtlPlugin;
}
