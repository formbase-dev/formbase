export function absoluteUrl(path: string, origin: string) {
  return new URL(path, origin).toString();
}
