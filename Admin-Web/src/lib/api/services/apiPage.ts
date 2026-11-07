export function getPageContent<T>(
  data: T[] | { content?: T[] }
): T[] {
  return Array.isArray(data)
    ? data
    : data.content ?? [];
}
