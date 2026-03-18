/**
 * Local date helpers to avoid UTC day-shifts when working with `type="date"` inputs.
 *
 * `toISOString().slice(0, 10)` is UTC-based, so it can show the previous/next day
 * for users in non-UTC timezones. These helpers treat YMD as "local calendar day".
 */

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function isValidYMD(ymd: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd);
}

/**
 * Parse `YYYY-MM-DD` as local midnight.
 * Falls back to `new Date(ymd)` if input doesn't match the expected format.
 */
export function parseYMDLocal(ymd: string): Date {
  if (!isValidYMD(ymd)) return new Date(ymd);
  const [yS, mS, dS] = ymd.split("-");
  const y = Number(yS);
  const m = Number(mS);
  const day = Number(dS);
  return new Date(y, m - 1, day, 0, 0, 0, 0);
}

export function startOfLocalDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfLocalDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

