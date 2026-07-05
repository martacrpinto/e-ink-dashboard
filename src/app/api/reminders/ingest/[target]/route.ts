import { NextResponse, type NextRequest } from "next/server";
import { ingestTokenMatches } from "../../../../../lib/auth";
import { saveReminderItems, type ReminderTarget } from "../../../../../lib/reminders";

// Called by the iOS Shortcut running on the phone (see README). This route is
// intentionally excluded from the session-cookie auth in proxy.ts — it has
// its own bearer-token check, since the Shortcut can't do a browser login.
export async function POST(request: NextRequest, { params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  if (target !== "groceries" && target !== "daily") {
    return NextResponse.json({ error: "target must be 'groceries' or 'daily'" }, { status: 404 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!ingestTokenMatches(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  // Accept a raw array, `{ items: [...] }`, or a single bare object (both at
  // the top level and inside `items`) — Shortcuts silently unwraps a
  // one-element list into a plain dictionary when serializing to JSON.
  const rawItems = Array.isArray(body) ? body : (body as { items?: unknown })?.items;
  const items = Array.isArray(rawItems)
    ? rawItems
    : rawItems && typeof rawItems === "object"
      ? [rawItems]
      : body && typeof body === "object" && !("items" in (body as object))
        ? [body]
        : null;
  if (!items) {
    return NextResponse.json({ error: "body must be an array or { items: [...] }" }, { status: 400 });
  }

  try {
    await saveReminderItems(target as ReminderTarget, items);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, target, count: items.length });
}
