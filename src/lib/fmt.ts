const TZ = process.env.DASHBOARD_TZ ?? "Europe/Lisbon";
const LOCALE = "pt-PT";

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatDayLong(date: Date = new Date()): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(date);
}

export function formatDayShort(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** Calendar day key (YYYY-MM-DD) in the dashboard timezone. */
export function dayKey(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function isToday(iso: string): boolean {
  return dayKey(iso) === todayKey();
}

export function isOverdue(iso: string): boolean {
  return dayKey(iso) < todayKey();
}

/** Weekday name in English (matches the Notion `Days` multi-select options). */
export function todayWeekdayEn(): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: TZ }).format(new Date());
}
