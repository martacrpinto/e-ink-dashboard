import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "../../lib/auth";
import { getAdhocTasks, getWorkTasks } from "../../lib/notion";
import { getCalendars } from "../../lib/calendar";
import { getReminders } from "../../lib/reminders";
import { getWeather } from "../../lib/weather";
import { dayKey, formatDayLong, formatTime, isOverdue, isToday, todayKey, todayWeekdayEn } from "../../lib/fmt";
import { SOURCE_SYMBOL } from "../../components/rows";
import type { NotionTask } from "../../lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "e-ink 800×480" };

// 800×480 static render for a future TRMNL/InkyPi-style device to screenshot.
// Auth: ?token=<EINK_TOKEN> (for the device) or the normal session cookie.
export default async function EinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const tokenOk = Boolean(process.env.EINK_TOKEN) && token === process.env.EINK_TOKEN;
  const cookieStore = await cookies();
  const cookieOk = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!tokenOk && !cookieOk) {
    return (
      <div data-eink className="flex h-[480px] w-[800px] items-center justify-center border border-black font-mono text-sm">
        401 — usa ?token=EINK_TOKEN
      </div>
    );
  }

  const [adhoc, work, calendars, reminders, weather] = await Promise.all([
    getAdhocTasks(),
    getWorkTasks(),
    getCalendars(),
    getReminders(),
    getWeather(),
  ]);

  const weekday = todayWeekdayEn();
  const events = calendars.merged.filter((e) => dayKey(e.start) === todayKey()).slice(0, 7);
  const forToday = (t: NotionTask) =>
    t.doToday ||
    (t.due ? isToday(t.due) || isOverdue(t.due) : false) ||
    (t.recurring && (t.days ?? []).includes(weekday));
  const tasks = [
    ...(adhoc.status === "ok" ? adhoc.data.filter(forToday).map((t) => ({ ...t, sym: SOURCE_SYMBOL.adhoc })) : []),
    ...(work.status === "ok"
      ? work.data
          .filter((t) => t.due && (isToday(t.due) || isOverdue(t.due)))
          .map((t) => ({ ...t, sym: SOURCE_SYMBOL.work }))
      : []),
  ].slice(0, 8);
  const daily = reminders.status === "ok" ? (reminders.data.daily ?? []).slice(0, 8) : [];
  const groceriesCount = reminders.status === "ok" ? (reminders.data.groceries?.length ?? 0) : 0;

  return (
    <div
      data-eink
      className="flex h-[480px] w-[800px] flex-col overflow-hidden border border-black bg-paper p-4 text-ink"
    >
      <div className="flex items-end justify-between border-b-2 border-black pb-2">
        <p className="text-2xl font-bold capitalize">{formatDayLong()}</p>
        <p className="text-2xl font-bold">
          {weather.status === "ok" ? (
            <>
              {weather.data.glyph} {weather.data.temperature}°{" "}
              <span className="text-sm font-normal">
                {weather.data.tempMin}°/{weather.data.tempMax}°
              </span>
            </>
          ) : null}
        </p>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-3 gap-4 overflow-hidden text-sm">
        <section>
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest">Agenda</h2>
          <ul className="mt-1">
            {events.length === 0 ? <li className="text-ink-3">Sem eventos.</li> : null}
            {events.map((e) => (
              <li key={e.id} className="flex gap-1 border-b border-rule py-1">
                <span>{SOURCE_SYMBOL[e.source]}</span>
                <span className="font-mono tnum">{e.allDay ? "dia" : formatTime(e.start)}</span>
                <span className="truncate">{e.title}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest">Tarefas</h2>
          <ul className="mt-1">
            {tasks.length === 0 ? <li className="text-ink-3">Nada para hoje.</li> : null}
            {tasks.map((t) => (
              <li key={t.id} className="flex gap-1 border-b border-rule py-1">
                <span>{t.sym}</span>
                <span className="truncate">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Diárias · compras: {groceriesCount}
          </h2>
          <ul className="mt-1">
            {daily.length === 0 ? <li className="text-ink-3">Tudo feito.</li> : null}
            {daily.map((r) => (
              <li key={r.id} className="flex gap-1 border-b border-rule py-1">
                <span>☐</span>
                <span className="truncate">{r.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="mt-2 border-t border-black pt-1 font-mono text-[9px] uppercase tracking-widest text-ink-2">
        ● google ○ outlook ▲ tarefas ■ trabalho · atualizado{" "}
        {formatTime(new Date().toISOString())}
      </p>
    </div>
  );
}
