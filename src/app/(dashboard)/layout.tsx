import type { ReactNode } from "react";
import Nav from "../../components/Nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="w-full flex-1 px-4 py-6">{children}</main>
      <footer className="w-full px-4 pb-6 font-mono text-[10px] uppercase tracking-widest text-ink-3">
        ● google · ○ outlook · ▲ tarefas · ■ trabalho · ◆ reminders
      </footer>
    </>
  );
}
