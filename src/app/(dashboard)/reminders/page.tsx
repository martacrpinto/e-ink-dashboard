import { getReminders } from "../../../lib/reminders";
import { Empty, Panel, SourceState } from "../../../components/Panel";
import { ReminderRow } from "../../../components/rows";
import { formatTime } from "../../../lib/fmt";
import type { ReminderItem } from "../../../lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reminders — e-ink dashboard" };

function List({ items }: { items: ReminderItem[] | null }) {
  if (items === null) {
    return <Empty>Ainda sem dados — corre o Atalho no iPhone pelo menos uma vez.</Empty>;
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

function UpdatedAt({ iso }: { iso: string | null }) {
  if (!iso) return null;
  return <p className="mt-2 text-xs text-ink-3">Atualizado às {formatTime(iso)}</p>;
}

export default async function RemindersPage() {
  const result = await getReminders();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">◆ Apple Reminders</h1>
      <SourceState result={result}>
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Compras">
              <List items={data.groceries} />
              <UpdatedAt iso={data.groceriesUpdatedAt} />
            </Panel>
            <Panel title="Diárias">
              <List items={data.daily} />
              <UpdatedAt iso={data.dailyUpdatedAt} />
            </Panel>
          </div>
        )}
      </SourceState>
    </div>
  );
}
