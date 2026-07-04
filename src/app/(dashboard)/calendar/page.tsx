import { getCalendars } from "../../../lib/calendar";
import { dayKey, formatDayShort, todayKey } from "../../../lib/fmt";
import { Empty, Panel, SourceState } from "../../../components/Panel";
import { EventRow } from "../../../components/rows";
import type { CalendarEvent } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendário — e-ink dashboard" };

export default async function CalendarPage() {
  const { google, outlook, merged } = await getCalendars();

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of merged) {
    const key = dayKey(e.start);
    // the fetch window starts at server-local midnight; drop days already past
    // in the dashboard timezone
    if (key < todayKey()) continue;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }
  const days = [...byDay.keys()].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold">Calendário · 7 dias</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-3">
          ● google · ○ outlook
        </p>
      </div>

      {google.status !== "ok" || outlook.status !== "ok" ? (
        <div className="space-y-1 border-2 border-rule bg-paper-raised p-4">
          {google.status !== "ok" ? (
            <SourceState result={google}>{() => null}</SourceState>
          ) : null}
          {outlook.status !== "ok" ? (
            <SourceState result={outlook}>{() => null}</SourceState>
          ) : null}
        </div>
      ) : null}

      {days.length === 0 && (google.status === "ok" || outlook.status === "ok") ? (
        <Empty>Sem eventos nos próximos 7 dias.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => {
            const events = byDay.get(day)!;
            const isTodayDay = day === todayKey();
            return (
              <Panel
                key={day}
                title={isTodayDay ? `Hoje · ${formatDayShort(events[0].start)}` : formatDayShort(events[0].start)}
                className={isTodayDay ? "outline outline-2 outline-offset-2 outline-rule-strong" : ""}
              >
                <ul>
                  {events.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
