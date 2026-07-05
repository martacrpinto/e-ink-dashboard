import { getRemindersDebug } from "../../../../lib/caldav";
import { SourceState } from "../../../../components/Panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reminders debug" };

// Temporary diagnostic page: shows every calendar the CalDAV account can see
// (VTODO-capable or not), how many items each VTODO calendar has, and a raw
// property dump of every item. Delete once the tag-matching mismatch is understood.
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
                Todos os calendários vistos pelo CalDAV
              </h2>
              <pre className="mt-2 overflow-x-auto border-2 border-rule-strong bg-paper-raised p-3 text-xs">
                {JSON.stringify(data.allCalendars, null, 2)}
              </pre>
            </section>

            <section>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                Listas VTODO e contagem de itens
              </h2>
              <pre className="mt-2 overflow-x-auto border-2 border-rule-strong bg-paper-raised p-3 text-xs">
                {JSON.stringify(data.todoListCounts, null, 2)}
              </pre>
            </section>

            <section>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-widest">
                Itens (propriedades em bruto)
              </h2>
              {data.items.length === 0 ? (
                <p className="mt-2">Nenhum item encontrado em nenhuma lista.</p>
              ) : (
                <div className="mt-2 space-y-4">
                  {data.items.map((item, i) => (
                    <pre
                      key={i}
                      className="overflow-x-auto border-2 border-rule-strong bg-paper-raised p-3 text-xs"
                    >
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </SourceState>
    </div>
  );
}
