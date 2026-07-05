import { head, put } from "@vercel/blob";
import type { ReminderItem, RemindersData, SourceResult } from "./types";

export type ReminderTarget = "groceries" | "daily";

function blobPath(target: ReminderTarget): string {
  return `reminders/${target}.json`;
}

interface StoredPayload {
  updatedAt: string;
  items: unknown[];
}

function toIso(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

// Apple Shortcuts serializes a "Reminders" magic variable to JSON with
// capitalized, space-separated keys (e.g. "Due Date"); we accept those plus
// a few lenient variants so small differences in how the Shortcut is built
// don't silently drop data.
function normalizeItem(raw: unknown): ReminderItem | null {
  // Shortcuts collapses a single-item list to a bare string (just the
  // reminder's title) instead of a dictionary — treat that as a minimal item.
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed ? { id: crypto.randomUUID(), title: trimmed, due: null, priority: 0, tags: [] } : null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const title = pick(obj, ["title", "Title", "name", "Name"]);
  if (typeof title !== "string" || !title.trim()) return null;

  const completed = pick(obj, ["completed", "Completed", "isCompleted", "IsCompleted"]);
  if (completed === true) return null;

  const due = toIso(pick(obj, ["due", "Due", "dueDate", "Due Date", "DueDate"]));
  const priorityRaw = pick(obj, ["priority", "Priority"]);
  const priority = typeof priorityRaw === "number" ? priorityRaw : Number(priorityRaw) || 0;
  const list = pick(obj, ["list", "List"]);
  const tagsRaw = pick(obj, ["tags", "Tags"]);
  const tags = Array.isArray(tagsRaw) ? tagsRaw.map(String) : [];

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    due,
    priority,
    list: typeof list === "string" ? list : undefined,
    tags,
  };
}

function byPriorityThenTitle(a: ReminderItem, b: ReminderItem): number {
  return (a.priority || 10) - (b.priority || 10) || a.title.localeCompare(b.title);
}

async function readBlob(target: ReminderTarget): Promise<StoredPayload | null> {
  try {
    const meta = await head(blobPath(target));
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as StoredPayload;
  } catch {
    return null;
  }
}

export async function saveReminderItems(target: ReminderTarget, items: unknown[]): Promise<void> {
  const payload: StoredPayload = { updatedAt: new Date().toISOString(), items };
  await put(blobPath(target), JSON.stringify(payload), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getReminders(): Promise<SourceResult<RemindersData>> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { status: "unconfigured", hint: "Liga o Vercel Blob ao projeto (Storage → Create Database → Blob)" };
  }
  try {
    const [groceries, daily] = await Promise.all([readBlob("groceries"), readBlob("daily")]);
    return {
      status: "ok",
      data: {
        groceries: groceries ? groceries.items.map(normalizeItem).filter((i): i is ReminderItem => i !== null).sort(byPriorityThenTitle) : null,
        daily: daily ? daily.items.map(normalizeItem).filter((i): i is ReminderItem => i !== null).sort(byPriorityThenTitle) : null,
        groceriesUpdatedAt: groceries?.updatedAt ?? null,
        dailyUpdatedAt: daily?.updatedAt ?? null,
      },
    };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

export interface DebugPayload {
  groceries: StoredPayload | null;
  daily: StoredPayload | null;
}

export async function getRemindersDebug(): Promise<SourceResult<DebugPayload>> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { status: "unconfigured", hint: "Liga o Vercel Blob ao projeto (Storage → Create Database → Blob)" };
  }
  try {
    const [groceries, daily] = await Promise.all([readBlob("groceries"), readBlob("daily")]);
    return { status: "ok", data: { groceries, daily } };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
