const attempts = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit = 8, windowMs = 15 * 60_000) {
  const now = Date.now(); const item = attempts.get(key);
  if (!item || item.reset < now) { attempts.set(key, { count: 1, reset: now + windowMs }); return; }
  if (item.count >= limit) throw new Error("RATE_LIMIT");
  item.count++;
}
