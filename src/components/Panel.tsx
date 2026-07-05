import type { ReactNode } from "react";
import type { SourceResult } from "../lib/types";

export function Panel({
  title,
  symbol,
  children,
  className = "",
}: {
  title: string;
  symbol?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 border-2 border-rule-strong bg-paper-raised ${className}`}>
      <h2 className="flex items-baseline gap-2 border-b-2 border-rule-strong px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.15em]">
        {symbol ? <span aria-hidden>{symbol}</span> : null}
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="border-2 border-rule-strong bg-paper-raised px-4 py-3">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1 text-3xl font-semibold leading-none">{value}</p>
      {note ? <p className="mt-1 text-xs text-ink-2">{note}</p> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-ink-3">{children}</p>;
}

/** Renders unconfigured/error states; calls `children` only when data exists. */
export function SourceState<T>({
  result,
  children,
}: {
  result: SourceResult<T>;
  children: (data: T) => ReactNode;
}) {
  if (result.status === "unconfigured") {
    return (
      <p className="py-2 text-sm text-ink-3">
        Não configurado — {result.hint}. Vê o README.
      </p>
    );
  }
  if (result.status === "error") {
    return (
      <p className="py-2 text-sm text-ink-2">
        ⚠ Erro ao ler a fonte: <span className="font-mono text-xs">{result.message}</span>
      </p>
    );
  }
  return <>{children(result.data)}</>;
}
