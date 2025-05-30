/**
 * Filters out undefined values from an object, returning a new object with only defined values.
 * @param attributes - The input object to filter.
 * @returns A new object with keys whose values are not undefined.
 * @example
 * const obj = { a: 1, b: undefined, c: 'test', d: false };
 * const filtered = filterUndefined(obj); // { a: 1, c: 'test', d: false }
 */

export function filterUndefined<T extends Record<string, unknown>, V = string | number | boolean>(
  attributes: T,
): Record<string, V> {
  const filtered: Record<string, V> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      filtered[key] = value as V;
    }
  }
  return filtered;
}