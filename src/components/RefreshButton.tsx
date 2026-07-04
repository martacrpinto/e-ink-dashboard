"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={busy}
      aria-label="Atualizar dados"
      title="Atualizar dados"
      className="border-2 border-rule-strong px-2 py-1 font-mono text-sm hover:bg-ink hover:text-paper disabled:opacity-40"
    >
      {busy ? "…" : "↻"}
    </button>
  );
}
