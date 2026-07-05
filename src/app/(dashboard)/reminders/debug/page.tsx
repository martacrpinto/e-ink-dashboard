import { getRemindersDebug } from "../../../../lib/reminders";
import { SourceState } from "../../../../components/Panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reminders debug" };

// Diagnostic page for the Shortcuts-based Reminders sync: shows exactly what
// the last POST to /api/reminders/ingest/[target] stored, so you can confirm
// the Shortcut is sending the fields the dashboard expects (Title, Due Date,
// Priority, Completed — see README).
export default async function RemindersDebugPage() {
  const result = await getRemindersDebug();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reminders — diagnóstico</h1>
      <SourceState result={result}>
        {(data) => (
          <div className="space-y-6">
            <section>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                Compras (reminders/groceries.json)
              </h2>
              <pre className="mt-2 overflow-x-auto border-2 border-rule-strong bg-paper-raised p-3 text-xs">
                {data.groceries ? JSON.stringify(data.groceries, null, 2) : "Ainda sem dados."}
              </pre>
            </section>
            <section>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                Diárias (reminders/daily.json)
              </h2>
              <pre className="mt-2 overflow-x-auto border-2 border-rule-strong bg-paper-raised p-3 text-xs">
                {data.daily ? JSON.stringify(data.daily, null, 2) : "Ainda sem dados."}
              </pre>
            </section>
          </div>
        )}
      </SourceState>
    </div>
  );
}
