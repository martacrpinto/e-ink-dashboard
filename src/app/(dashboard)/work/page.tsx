import { getWorkTasks } from "../../../lib/notion";
import { Empty, Panel, SourceState } from "../../../components/Panel";
import { SOURCE_SYMBOL, TaskRow } from "../../../components/rows";
import type { NotionTask } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trabalho — e-ink dashboard" };

function byDue(a: NotionTask, b: NotionTask): number {
  if (!a.due && !b.due) return a.title.localeCompare(b.title);
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due.localeCompare(b.due);
}

export default async function WorkPage() {
  const result = await getWorkTasks();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">■ Trabalho (Quick Capture)</h1>
      <SourceState result={result}>
        {(tasks) => {
          const inProgress = tasks.filter((t) => t.status === "In progress").sort(byDue);
          const notStarted = tasks.filter((t) => t.status !== "In progress").sort(byDue);
          return (
            <div className="grid gap-4 md:grid-cols-2">
              <Panel title={`Em curso (${inProgress.length})`}>
                {inProgress.length === 0 ? (
                  <Empty>Nada em curso.</Empty>
                ) : (
                  <ul>
                    {inProgress.map((t) => (
                      <TaskRow key={t.id} task={t} symbol={SOURCE_SYMBOL.work} />
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel title={`Por começar (${notStarted.length})`}>
                {notStarted.length === 0 ? (
                  <Empty>Nada por começar.</Empty>
                ) : (
                  <ul>
                    {notStarted.map((t) => (
                      <TaskRow key={t.id} task={t} symbol={SOURCE_SYMBOL.work} />
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          );
        }}
      </SourceState>
    </div>
  );
}
