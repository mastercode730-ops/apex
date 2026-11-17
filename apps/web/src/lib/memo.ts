/** Tiny in-process TTL cache with in-flight de-duplication, so N viewers cost one query per TTL window. */
// Held on globalThis: Next bundles routes and pages separately, and each bundle would otherwise get its own copy.
const g = globalThis as unknown as { __apexMemo?: Map<string, { t: number; v: Promise<unknown> }> };
const store = (g.__apexMemo ??= new Map());

export function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v as Promise<T>;
  const v = fn();
  store.set(key, { t: Date.now(), v });
  v.catch(() => { if (store.get(key)?.v === v) store.delete(key); });
  if (store.size > 500) { const first = store.keys().next().value; if (first) store.delete(first); }
  return v;
}

/** Drop cached entries whose key starts with `prefix` (used after admin writes so changes show immediately). */
export function memoInvalidate(prefix: string) {
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
}
