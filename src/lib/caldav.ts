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
    items.push({
      id: String(vtodo.getFirstPropertyValue("uid") ?? crypto.randomUUID()),
      title: String(vtodo.getFirstPropertyValue("summary") ?? "(sem título)"),
      due: due ? (due as ICAL.Time).toJSDate().toISOString() : null,
      priority: Number(vtodo.getFirstPropertyValue("priority") ?? 0),
      list,
    });
  }
  return items;
}

const fetchReminders = unstable_cache(
  async (
    email: string,
    password: string,
    groceriesList: string,
    dailyList: string,
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

    async function loadList(name: string): Promise<ReminderItem[] | null> {
      const cal = todoLists.find(
        (c) => String(c.displayName ?? "").toLowerCase() === name.toLowerCase(),
      );
      if (!cal) return null;
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
      const items = objects.flatMap((o) =>
        o.data ? parseTodos(String(o.data), String(cal.displayName ?? name)) : [],
      );
      // priority 0 (none) last, then 1..9; ties by title
      return items.sort(
        (a, b) =>
          (a.priority || 10) - (b.priority || 10) || a.title.localeCompare(b.title),
      );
    }

    const [groceries, daily] = await Promise.all([
      loadList(groceriesList),
      loadList(dailyList),
    ]);
    return { groceries, daily, listsFound };
  },
  ["icloud-reminders"],
  { revalidate: REVALIDATE, tags: ["reminders"] },
);

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
        process.env.REMINDERS_GROCERIES_LIST ?? "Groceries",
        process.env.REMINDERS_DAILY_LIST ?? "Daily",
      ),
    };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
