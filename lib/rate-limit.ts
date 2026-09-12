const attempts = new Map<string, { count: number; reset: number }>();
export class RateLimitError extends Error { constructor(public retryAfterMs:number){super("RATE_LIMIT");} }
export function rateLimit(key: string, limit = 8, windowMs = 15 * 60_000) {
  const now = Date.now(); const item = attempts.get(key);
  if (!item || item.reset < now) { attempts.set(key, { count: 1, reset: now + windowMs }); return; }
  if (item.count >= limit) throw new RateLimitError(Math.max(0,item.reset-now));
  item.count++;
}
