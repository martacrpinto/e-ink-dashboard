import type { ReactNode } from "react";
import Nav from "../../components/Nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 font-mono text-[10px] uppercase tracking-widest text-ink-3">
        ● google · ○ outlook · ▲ tarefas · ■ trabalho · ◆ reminders
      </footer>
    </>
  );
}
