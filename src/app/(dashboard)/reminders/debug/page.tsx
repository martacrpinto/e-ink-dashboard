import { getRemindersDebug } from "../../../../lib/caldav";
import { SourceState } from "../../../../components/Panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reminders debug" };

// Temporary diagnostic page: dumps every raw VTODO property found across all
// iCloud lists, to figure out how tags/categories actually serialize for a
// given account. Delete once the tag-matching mismatch is understood.
export default async function RemindersDebugPage() {
  const result = await getRemindersDebug();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reminders — diagnóstico</h1>
      <SourceState result={result}>
        {(items) =>
          items.length === 0 ? (
            <p>Nenhum item encontrado em nenhuma lista.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item, i) => (
                <pre
                  key={i}
                  className="overflow-x-auto border-2 border-rule-strong bg-paper-raised p-3 text-xs"
                >
                  {JSON.stringify(item, null, 2)}
                </pre>
              ))}
            </div>
          )
        }
      </SourceState>
    </div>
  );
}
