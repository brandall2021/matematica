declare module 'dompurify' {
  interface DOMPurifyStatic {
    sanitize(dirty: string, config?: { ALLOWED_TAGS?: string[] }): string;
  }
  const DOMPurify: DOMPurifyStatic;
  export default DOMPurify;
}
