// supabase-js returns rows with the database's snake_case column names
// (e.g. tail_number, home_airport, started_at) verbatim — there is no
// built-in camelCase conversion. The app's domain types (Aircraft,
// ServiceRequest, Invoice, Membership, ...) are declared in camelCase to
// match normal JS/TS convention, so every raw query result needs to pass
// through this before it's treated as one of those types. Skipping this
// doesn't throw — multi-word fields just silently read as `undefined`
// (e.g. membership.startedAt on a row that only has started_at).
function toCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

export function camelizeKeys<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelizeKeys(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [toCamelKey(key), camelizeKeys(val)])
    ) as T;
  }
  return value as T;
}
