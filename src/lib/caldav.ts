import { unstable_cache } from "next/cache";
import { createDAVClient } from "tsdav";
import ICAL from "ical.js";
import type { ReminderItem, RemindersData, SourceResult } from "./types";

const REVALIDATE = 300;

function parseTodos(icsData: string, list: string): ReminderItem[] {
  const items: ReminderItem[] = [];
  const root = new ICAL.Component(ICAL.parse(icsData));
  for (const vtodo of root.getAllSubcomponents("vtodo")) {
    const status = vtodo.getFirstPropertyValue("status");
    const completed = vtodo.getFirstPropertyValue("completed");
    if (status === "COMPLETED" || status === "CANCELLED" || completed) continue;
    const due = vtodo.getFirstPropertyValue("due");
    const tags = (vtodo.getFirstProperty("categories")?.getValues() ?? []).map(String);
    items.push({
      id: String(vtodo.getFirstPropertyValue("uid") ?? crypto.randomUUID()),
      title: String(vtodo.getFirstPropertyValue("summary") ?? "(sem título)"),
      due: due ? (due as ICAL.Time).toJSDate().toISOString() : null,
      priority: Number(vtodo.getFirstPropertyValue("priority") ?? 0),
      list,
      tags,
    });
  }
  return items;
}

function byPriorityThenTitle(a: ReminderItem, b: ReminderItem): number {
  return (a.priority || 10) - (b.priority || 10) || a.title.localeCompare(b.title);
}

// A "list" selector matches a real iCloud list by name; a "tag" selector
// matches the CATEGORIES property across every list — this is what Apple's
// Smart Lists (e.g. a "Groceries" tile filtering by a #Comida tag) need,
// since Smart Lists aren't real CalDAV calendars and never appear in listsFound.
export type ReminderSelector = { mode: "list"; value: string } | { mode: "tag"; value: string };

const fetchReminders = unstable_cache(
  async (
    email: string,
    password: string,
    groceries: ReminderSelector,
    daily: ReminderSelector,
  ): Promise<RemindersData> => {
    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: email, password },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    const calendars = await client.fetchCalendars();
    const todoLists = calendars.filter((c) =>
      (c.components ?? []).includes("VTODO"),
    );
    const listsFound = todoLists.map((c) => String(c.displayName ?? ""));

    const itemsByList = await Promise.all(
      todoLists.map(async (cal) => {
        const objects = await client.fetchCalendarObjects({
          calendar: cal,
          filters: [
            {
              "comp-filter": {
                _attributes: { name: "VCALENDAR" },
                "comp-filter": { _attributes: { name: "VTODO" } },
              },
            },
          ],
        });
        return objects.flatMap((o) =>
          o.data ? parseTodos(String(o.data), String(cal.displayName ?? "")) : [],
        );
      }),
    );
    const allItems = itemsByList.flat();

    function resolve(selector: ReminderSelector): ReminderItem[] | null {
      if (selector.mode === "tag") {
        const tag = selector.value.toLowerCase();
        return allItems
          .filter((item) => item.tags.some((t) => t.toLowerCase() === tag))
          .sort(byPriorityThenTitle);
      }
      const name = selector.value.toLowerCase();
      const exists = todoLists.some((c) => String(c.displayName ?? "").toLowerCase() === name);
      if (!exists) return null;
      return allItems
        .filter((item) => item.list.toLowerCase() === name)
        .sort(byPriorityThenTitle);
    }

    return { groceries: resolve(groceries), daily: resolve(daily), listsFound };
  },
  ["icloud-reminders"],
  { revalidate: REVALIDATE, tags: ["reminders"] },
);

function selector(tagEnv: string | undefined, listEnv: string | undefined, defaultList: string): ReminderSelector {
  if (tagEnv) return { mode: "tag", value: tagEnv };
  return { mode: "list", value: listEnv ?? defaultList };
}

export async function getReminders(): Promise<SourceResult<RemindersData>> {
  const email = process.env.ICLOUD_EMAIL;
  const password = process.env.ICLOUD_APP_PASSWORD;
  if (!email || !password) {
    return { status: "unconfigured", hint: "Define ICLOUD_EMAIL e ICLOUD_APP_PASSWORD" };
  }
  try {
    return {
      status: "ok",
      data: await fetchReminders(
        email,
        password,
        selector(process.env.REMINDERS_GROCERIES_TAG, process.env.REMINDERS_GROCERIES_LIST, "Groceries"),
        selector(process.env.REMINDERS_DAILY_TAG, process.env.REMINDERS_DAILY_LIST, "Daily"),
      ),
    };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
