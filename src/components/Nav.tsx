"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import RefreshButton from "./RefreshButton";

const LINKS = [
  { href: "/", label: "Hoje" },
  { href: "/tasks", label: "Tarefas" },
  { href: "/work", label: "Trabalho" },
  { href: "/calendar", label: "Calendário" },
  { href: "/reminders", label: "Reminders" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b-2 border-rule-strong bg-paper-raised">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.25em]">
          ▪ e-ink
        </Link>
        <nav className="hidden gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1 text-sm font-medium ${
                pathname === l.href
                  ? "bg-ink text-paper"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="border-2 border-rule-strong px-2 py-1 font-mono text-sm sm:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t-2 border-rule sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 text-sm font-medium ${
                pathname === l.href ? "bg-ink text-paper" : "text-ink-2"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
