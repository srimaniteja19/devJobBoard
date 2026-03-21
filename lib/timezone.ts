export const DEFAULT_REPORT_TIME_ZONE = "America/New_York";

type DateTimeFormatOptions = Intl.DateTimeFormatOptions;

function toLocaleYMD(date: Date, timeZone: string): string {
  // en-CA produces YYYY-MM-DD in a stable order.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTimeZoneDateYMD(date: Date, timeZone: string): string {
  return toLocaleYMD(date, timeZone);
}

function parseYMD(ymd: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new Error(`Invalid YMD: ${ymd}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Gregorian calendar add/subtract days on a `YYYY-MM-DD` string (timezone-agnostic wall date). */
export function addCalendarDaysYMD(ymd: string, deltaDays: number): string {
  const { y, m, d } = parseYMD(ymd);
  const x = new Date(Date.UTC(y, m - 1, d));
  x.setUTCDate(x.getUTCDate() + deltaDays);
  return `${x.getUTCFullYear()}-${pad2(x.getUTCMonth() + 1)}-${pad2(x.getUTCDate())}`;
}

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** 0 = Sunday, matching `Date#getDay()`. */
export function getWeekdaySunday0InTimeZone(date: Date, timeZone: string): number {
  const long = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(date);
  const idx = WEEKDAYS_LONG.indexOf(long as (typeof WEEKDAYS_LONG)[number]);
  if (idx < 0) throw new Error(`Unexpected weekday: ${long}`);
  return idx;
}

export function startOfTimeZoneDayFromYMD(ymd: string, timeZone: string): Date {
  const { y, m, d } = parseYMD(ymd);
  return zonedTimeToUtc(timeZone, y, m, d, 0, 0, 0);
}

/** Start of the Sunday-based week containing `date` in `timeZone`. */
export function startOfTimeZoneWeekSunday(date: Date, timeZone: string): Date {
  const ymd = getTimeZoneDateYMD(date, timeZone);
  const wd = getWeekdaySunday0InTimeZone(date, timeZone);
  const weekStartYmd = addCalendarDaysYMD(ymd, -wd);
  return startOfTimeZoneDayFromYMD(weekStartYmd, timeZone);
}

export function startOfTimeZoneMonth(date: Date, timeZone: string): Date {
  const ymd = getTimeZoneDateYMD(date, timeZone);
  return startOfTimeZoneDayFromYMD(`${ymd.slice(0, 7)}-01`, timeZone);
}

/** Last millisecond of the calendar day containing `date` in `timeZone`. */
export function endOfTimeZoneDay(date: Date, timeZone: string): Date {
  const ymd = getTimeZoneDateYMD(date, timeZone);
  const nextYmd = addCalendarDaysYMD(ymd, 1);
  return new Date(startOfTimeZoneDayFromYMD(nextYmd, timeZone).getTime() - 1);
}

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  // Computes: (local time for `date` in `timeZone`) - (UTC time for `date`) in ms.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const get = (type: string) => {
    const p = parts.find((x) => x.type === type)?.value;
    if (!p) throw new Error(`Missing ${type} in formatToParts result`);
    return p;
  };

  const asUTC = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );

  return asUTC - date.getTime();
}

function zonedTimeToUtc(
  timeZone: string,
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  ss: number
): Date {
  // Start with a UTC guess for the same wall-clock fields, then correct by the offset.
  let utcGuess = new Date(Date.UTC(y, m - 1, d, hh, mm, ss, 0));
  let offset = getTimeZoneOffsetMs(timeZone, utcGuess);
  let utc = new Date(utcGuess.getTime() - offset);

  // Second pass to handle DST transitions.
  offset = getTimeZoneOffsetMs(timeZone, utc);
  utc = new Date(utcGuess.getTime() - offset);
  return utc;
}

export function startOfTimeZoneDay(date: Date, timeZone: string): Date {
  const { y, m, d } = parseYMD(getTimeZoneDateYMD(date, timeZone));
  return zonedTimeToUtc(timeZone, y, m, d, 0, 0, 0);
}

export function formatInTimeZone(
  date: Date,
  timeZone: string,
  options: DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(date);
}

