import Link from "next/link";
import { getAdhocTasks } from "../../../lib/notion";
import { todayWeekdayEn } from "../../../lib/fmt";
import { Empty, Panel, SourceState } from "../../../components/Panel";
import { SOURCE_SYMBOL, TaskRow } from "../../../components/rows";
import type { NotionTask } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarefas — e-ink dashboard" };

const STATUS_ORDER = ["In progress", "Not started"];

function byDue(a: NotionTask, b: NotionTask): number {
  if (!a.due && !b.due) return a.title.localeCompare(b.title);
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due.localeCompare(b.due);
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string }>;
}) {
  const { bucket } = await searchParams;
  const result = await getAdhocTasks();
  const weekday = todayWeekdayEn();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">▲ Tarefas ad-hoc</h1>
      <SourceState result={result}>
        {(tasks) => {
          const buckets = [...new Set(tasks.flatMap((t) => t.buckets ?? []))].sort();
          const filtered = bucket ? tasks.filter((t) => (t.buckets ?? []).includes(bucket)) : tasks;
          const recurringToday = filtered.filter(
            (t) => t.recurring && (t.days ?? []).includes(weekday),
          );
          return (
            <>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/tasks"
                  className={`border-2 border-rule-strong px-3 py-1 text-sm ${!bucket ? "bg-ink text-paper" : ""}`}
                >
                  Todas
                </Link>
                {buckets.map((b) => (
                  <Link
                    key={b}
                    href={`/tasks?bucket=${encodeURIComponent(b)}`}
                    className={`border-2 border-rule-strong px-3 py-1 text-sm ${bucket === b ? "bg-ink text-paper" : ""}`}
                  >
                    {b}
                  </Link>
                ))}
              </div>

              {recurringToday.length > 0 ? (
                <Panel title={`Recorrentes de hoje (${weekday})`}>
                  <ul>
                    {recurringToday.map((t) => (
                      <TaskRow key={t.id} task={t} symbol="↻" />
                    ))}
                  </ul>
                </Panel>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {STATUS_ORDER.map((status) => {
                  const group = filtered
                    .filter((t) => t.status === status && !recurringToday.includes(t))
                    .sort(byDue);
                  return (
                    <Panel key={status} title={status === "In progress" ? "Em curso" : "Por começar"}>
                      {group.length === 0 ? (
                        <Empty>Nada aqui.</Empty>
                      ) : (
                        <ul>
                          {group.map((t) => (
                            <TaskRow key={t.id} task={t} symbol={SOURCE_SYMBOL.adhoc} />
                          ))}
                        </ul>
                      )}
                    </Panel>
                  );
                })}
              </div>
            </>
          );
        }}
      </SourceState>
    </div>
  );
}
