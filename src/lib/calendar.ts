import { unstable_cache } from "next/cache";
import ical, { type CalendarComponent, type VEvent } from "node-ical";
import type { CalendarEvent, SourceResult } from "./types";

const REVALIDATE = 300;
const WINDOW_DAYS = 8;

function isVEvent(c: CalendarComponent): c is VEvent {
  return c.type === "VEVENT";
}

function toEvent(
  ev: VEvent,
  start: Date,
  end: Date,
  source: CalendarEvent["source"],
  idSuffix = "",
): CalendarEvent {
  return {
    id: `${source}:${ev.uid ?? ev.summary}${idSuffix}`,
    title: String(ev.summary ?? "(sem título)"),
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: ev.datetype === "date",
    location: ev.location ? String(ev.location) : undefined,
    source,
  };
}

// Expand a VEVENT (including its RRULE) into the [from, to) window.
function expandEvent(ev: VEvent, from: Date, to: Date, source: CalendarEvent["source"]): CalendarEvent[] {
  const durationMs = ev.end && ev.start ? ev.end.getTime() - ev.start.getTime() : 0;

  if (!ev.rrule) {
    if (!ev.start) return [];
    const evEnd = ev.end ?? ev.start;
    if (evEnd <= from || ev.start >= to) return [];
    return [toEvent(ev, ev.start, evEnd, source)];
  }

  const exdates = new Set(
    Object.values(ev.exdate ?? {}).map((d) => new Date(d as unknown as Date).toDateString()),
  );
  const out: CalendarEvent[] = [];
  // Widen the window by one duration so events already running at `from` appear.
  const occurrences = ev.rrule.between(new Date(from.getTime() - durationMs), to, true);
  for (const occ of occurrences) {
    // node-ical's rrule returns dates whose wall-clock fields are in the event's
    // timezone but flagged UTC; shift by the difference so absolute time is right.
    const occStart = new Date(occ.getTime() + (occ.getTimezoneOffset() - ev.start.getTimezoneOffset()) * 60000);
    const key = occStart.toDateString();
    if (exdates.has(key)) continue;
    const override = ev.recurrences?.[occStart.toISOString().slice(0, 10) as keyof typeof ev.recurrences] as
      | VEvent
      | undefined;
    if (override) {
      const oEnd = override.end ?? override.start;
      if (override.start && oEnd > from && override.start < to) {
        out.push(toEvent(override, override.start, oEnd, source, `:${occStart.toISOString()}`));
      }
      continue;
    }
    const occEnd = new Date(occStart.getTime() + durationMs);
    if (occEnd <= from || occStart >= to) continue;
    out.push(toEvent(ev, occStart, occEnd, source, `:${occStart.toISOString()}`));
  }
  return out;
}

const fetchIcsEvents = unstable_cache(
  async (url: string, source: CalendarEvent["source"]): Promise<CalendarEvent[]> => {
    const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "e-ink-dashboard" } });
    if (!res.ok) throw new Error(`Feed ICS respondeu ${res.status}`);
    const parsed = ical.sync.parseICS(await res.text());

    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + WINDOW_DAYS * 86400000);

    const events: CalendarEvent[] = [];
    for (const component of Object.values(parsed)) {
      if (component && isVEvent(component)) events.push(...expandEvent(component, from, to, source));
    }
    return events.sort((a, b) => a.start.localeCompare(b.start));
  },
  ["ics-events"],
  { revalidate: REVALIDATE, tags: ["calendar"] },
);

async function getSource(
  url: string | undefined,
  source: CalendarEvent["source"],
  envVar: string,
): Promise<SourceResult<CalendarEvent[]>> {
  if (!url) return { status: "unconfigured", hint: `Define ${envVar}` };
  try {
    return { status: "ok", data: await fetchIcsEvents(url, source) };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

export interface CombinedCalendars {
  google: SourceResult<CalendarEvent[]>;
  outlook: SourceResult<CalendarEvent[]>;
  merged: CalendarEvent[];
}

export async function getCalendars(): Promise<CombinedCalendars> {
  const [google, outlook] = await Promise.all([
    getSource(process.env.GOOGLE_ICS_URL, "google", "GOOGLE_ICS_URL"),
    getSource(process.env.OUTLOOK_ICS_URL, "outlook", "OUTLOOK_ICS_URL"),
  ]);
  const merged = [
    ...(google.status === "ok" ? google.data : []),
    ...(outlook.status === "ok" ? outlook.data : []),
  ].sort((a, b) => a.start.localeCompare(b.start));
  return { google, outlook, merged };
}
