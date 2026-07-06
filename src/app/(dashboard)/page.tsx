import { getAdhocTasks, getWorkTasks } from "../../lib/notion";
import { getCalendars } from "../../lib/calendar";
import { getReminders } from "../../lib/reminders";
import { getWeather } from "../../lib/weather";
import { dayKey, formatDayLong, isOverdue, isToday, todayKey, todayWeekdayEn } from "../../lib/fmt";
import { Empty, Panel, SourceState, StatTile } from "../../components/Panel";
import { EventRow, ReminderRow, SOURCE_SYMBOL, TaskRow } from "../../components/rows";
import type { NotionTask } from "../../lib/types";

export const dynamic = "force-dynamic";

function isForToday(task: NotionTask, weekday: string): boolean {
  if (task.doToday) return true;
  if (task.due && (isToday(task.due) || isOverdue(task.due))) return true;
  if (task.recurring && (task.days ?? []).includes(weekday)) return true;
  return false;
}

export default async function OverviewPage() {
  const [adhoc, work, calendars, reminders, weather] = await Promise.all([
    getAdhocTasks(),
    getWorkTasks(),
    getCalendars(),
    getReminders(),
    getWeather(),
  ]);

  const weekday = todayWeekdayEn();
  const todaysEvents = calendars.merged.filter((e) => dayKey(e.start) === todayKey());
  const adhocToday = adhoc.status === "ok" ? adhoc.data.filter((t) => isForToday(t, weekday)) : [];
  const workToday =
    work.status === "ok"
      ? work.data.filter((t) => t.due && (isToday(t.due) || isOverdue(t.due)))
      : [];
  const groceries = reminders.status === "ok" ? reminders.data.groceries : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-rule-strong pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">hoje</p>
          <h1 className="text-3xl font-semibold capitalize sm:text-4xl">{formatDayLong()}</h1>
        </div>
        {weather.status === "ok" ? (
          <p className="text-xs text-ink-2">
            {weather.data.label} · {weather.data.tempMin}°/{weather.data.tempMax}° ·{" "}
            {weather.data.precipitationChance}% chuva
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Eventos hoje" value={calendars.merged.length ? todaysEvents.length : "—"} />
        <StatTile
          label="Tarefas para hoje"
          value={adhoc.status === "ok" ? adhocToday.length + workToday.length : "—"}
        />
        <StatTile label="Trabalho pendente" value={work.status === "ok" ? work.data.length : "—"} />
        <StatTile label="Lista de compras" value={groceries ? groceries.length : "—"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Agenda de hoje" className="xl:col-span-1">
          {calendars.google.status !== "ok" && calendars.outlook.status !== "ok" ? (
            <>
              <SourceState result={calendars.google}>{() => null}</SourceState>
              <SourceState result={calendars.outlook}>{() => null}</SourceState>
            </>
          ) : todaysEvents.length === 0 ? (
            <Empty>Sem eventos hoje.</Empty>
          ) : (
            <ul>
              {todaysEvents.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Tarefas de hoje">
          <SourceState result={adhoc}>
            {() =>
              adhocToday.length + workToday.length === 0 ? (
                <Empty>Nada marcado para hoje. ✨</Empty>
              ) : (
                <ul>
                  {adhocToday.map((t) => (
                    <TaskRow key={t.id} task={t} symbol={SOURCE_SYMBOL.adhoc} />
                  ))}
                  {workToday.map((t) => (
                    <TaskRow key={t.id} task={t} symbol={SOURCE_SYMBOL.work} />
                  ))}
                </ul>
              )
            }
          </SourceState>
        </Panel>

        <Panel title="Diárias" symbol={SOURCE_SYMBOL.reminders}>
          <SourceState result={reminders}>
            {(data) =>
              data.daily === null ? (
                <Empty>Ainda sem dados. Corre o Atalho no iPhone.</Empty>
              ) : data.daily.length === 0 ? (
                <Empty>Tudo feito por hoje.</Empty>
              ) : (
                <ul>
                  {data.daily.map((r) => (
                    <ReminderRow key={r.id} item={r} />
                  ))}
                </ul>
              )
            }
          </SourceState>
        </Panel>

        <Panel title="Compras" symbol={SOURCE_SYMBOL.reminders} className="md:col-span-2 xl:col-span-3">
          <SourceState result={reminders}>
            {(data) =>
              data.groceries === null ? (
                <Empty>Ainda sem dados. Corre o Atalho no iPhone.</Empty>
              ) : data.groceries.length === 0 ? (
                <Empty>Lista de compras vazia.</Empty>
              ) : (
                <ul className="columns-1 gap-8 sm:columns-2 lg:columns-3">
                  {data.groceries.map((r) => (
                    <li key={r.id} className="flex items-baseline gap-2 border-b border-rule py-2 break-inside-avoid">
                      <span aria-hidden className="font-mono text-sm">☐</span>
                      {r.title}
                    </li>
                  ))}
                </ul>
              )
            }
          </SourceState>
        </Panel>
      </div>
    </div>
  );
}
