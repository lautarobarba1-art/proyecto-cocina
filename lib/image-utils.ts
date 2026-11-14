export function isValidImageUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
