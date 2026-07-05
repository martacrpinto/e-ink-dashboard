import { getReminders } from "../../../lib/caldav";
import { Empty, Panel, SourceState } from "../../../components/Panel";
import { ReminderRow } from "../../../components/rows";
import type { ReminderItem } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reminders — e-ink dashboard" };

function List({ items, missing, listsFound }: { items: ReminderItem[] | null; missing: string; listsFound: string[] }) {
  if (items === null) {
    return (
      <Empty>
        Lista “{missing}” não encontrada no iCloud. Listas disponíveis:{" "}
        {listsFound.join(", ") || "nenhuma"}.
      </Empty>
    );
  }
  if (items.length === 0) return <Empty>Lista vazia. ✨</Empty>;
  return (
    <ul>
      {items.map((r) => (
        <ReminderRow key={r.id} item={r} />
      ))}
    </ul>
  );
}

function sourceLabel(tagEnv: string | undefined, listEnv: string | undefined, defaultList: string): string {
  return tagEnv ? `#${tagEnv}` : (listEnv ?? defaultList);
}

export default async function RemindersPage() {
  const result = await getReminders();
  const groceriesName = sourceLabel(
    process.env.REMINDERS_GROCERIES_TAG,
    process.env.REMINDERS_GROCERIES_LIST,
    "Groceries",
  );
  const dailyName = sourceLabel(process.env.REMINDERS_DAILY_TAG, process.env.REMINDERS_DAILY_LIST, "Daily");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">◆ Apple Reminders</h1>
      <SourceState result={result}>
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={`Compras · ${groceriesName}`}>
              <List items={data.groceries} missing={groceriesName} listsFound={data.listsFound} />
            </Panel>
            <Panel title={`Diárias · ${dailyName}`}>
              <List items={data.daily} missing={dailyName} listsFound={data.listsFound} />
            </Panel>
          </div>
        )}
      </SourceState>
    </div>
  );
}
