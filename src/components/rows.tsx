import type { CalendarEvent, NotionTask, ReminderItem } from "../lib/types";
import { formatDayShort, formatTime, isOverdue, isToday } from "../lib/fmt";

export const SOURCE_SYMBOL: Record<string, string> = {
  google: "●",
  outlook: "○",
  adhoc: "▲",
  work: "■",
  reminders: "◆",
};

function DueBadge({ due }: { due: string | null | undefined }) {
  if (!due) return null;
  const overdue = isOverdue(due);
  const today = isToday(due);
  return (
    <span
      className={`shrink-0 font-mono text-xs tnum ${
        overdue ? "bg-ink px-1 text-paper" : today ? "font-semibold" : "text-ink-3"
      }`}
    >
      {overdue ? "atrasada · " : ""}
      {formatDayShort(due)}
    </span>
  );
}

export function TaskRow({ task, symbol }: { task: NotionTask; symbol: string }) {
  const hasTags = task.status === "In progress" || Boolean(task.priority) || Boolean(task.due);
  return (
    <li className="flex items-start gap-2 border-b border-rule py-2 last:border-b-0">
      <span aria-hidden className="shrink-0 pt-0.5 text-xs">
        {symbol}
      </span>
      <div className="min-w-0 flex-1">
        <a href={task.url} target="_blank" rel="noreferrer" className="block truncate hover:underline">
          {task.title}
        </a>
        {hasTags ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {task.status === "In progress" ? (
              <span className="border border-rule-strong px-1 font-mono text-[10px] uppercase">
                em curso
              </span>
            ) : null}
            {task.priority ? <span className="text-xs text-ink-3">{task.priority}</span> : null}
            <DueBadge due={task.due} />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <li className="flex items-baseline gap-2 border-b border-rule py-2 last:border-b-0">
      <span aria-hidden className="shrink-0 text-xs">
        {SOURCE_SYMBOL[event.source]}
      </span>
      <span className="w-28 shrink-0 whitespace-nowrap font-mono text-sm tnum text-ink-2">
        {event.allDay ? "todo o dia" : `${formatTime(event.start)}–${formatTime(event.end)}`}
      </span>
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
    </li>
  );
}

export function ReminderRow({ item }: { item: ReminderItem }) {
  return (
    <li className="flex items-baseline gap-2 border-b border-rule py-2 last:border-b-0">
      <span aria-hidden className="shrink-0 font-mono text-sm">
        ☐
      </span>
      <span className="min-w-0 flex-1">
        {item.title}
        {item.priority > 0 && item.priority <= 4 ? (
          <span aria-label="prioridade alta" className="ml-2">
            !
          </span>
        ) : null}
      </span>
      <DueBadge due={item.due} />
    </li>
  );
}
