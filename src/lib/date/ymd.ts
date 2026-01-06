export type Ymd = `${number}-${number}-${number}`;

export function parseYmd(date: string): { y: number; m: number; d: number } {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date);
  if (!m) throw new Error("INVALID_DATE");
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function isValidYmd(date: string): boolean {
  try {
    const { y, m, d } = parseYmd(date);
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  } catch {
    return false;
  }
}

export function formatYmdFromLocalMidnightUtc(localMidnightUtcMs: number, tzOffsetMinutes: number): Ymd {
  // localMidnightUtcMs is UTC milliseconds for the user's local midnight
  const utcMs = localMidnightUtcMs + tzOffsetMinutes * 60_000;
  const dt = new Date(utcMs);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}` as Ymd;
}

export function localMidnightUtcMsFromYmd(date: Ymd, tzOffsetMinutes: number): number {
  const { y, m, d } = parseYmd(date);
  const utcMidnightMs = Date.UTC(y, m - 1, d);
  // Local midnight in user's timezone expressed in UTC ms
  return utcMidnightMs - tzOffsetMinutes * 60_000;
}

export function shiftYmd(date: Ymd, deltaDays: number, tzOffsetMinutes: number): Ymd {
  const base = localMidnightUtcMsFromYmd(date, tzOffsetMinutes);
  const shifted = base + deltaDays * 86_400_000;
  return formatYmdFromLocalMidnightUtc(shifted, tzOffsetMinutes);
}

export function weekdayFromYmd(date: Ymd, tzOffsetMinutes: number): number {
  const ms = localMidnightUtcMsFromYmd(date, tzOffsetMinutes);
  return new Date(ms).getUTCDay();
}
