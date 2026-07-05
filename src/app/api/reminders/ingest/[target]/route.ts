import { NextResponse, type NextRequest } from "next/server";
import { ingestTokenMatches } from "../../../../../lib/auth";
import { saveReminderItems, type ReminderTarget } from "../../../../../lib/reminders";

// When a Shortcut builds a list of Dictionaries (one per reminder) and drops
// it straight into a JSON body field, Shortcuts sometimes serializes each
// dictionary to its own JSON text and joins them with newlines, instead of
// nesting them as a real JSON array. Split those back apart here so each
// reminder becomes its own item; a plain non-JSON string (the even simpler
// single-item case) passes through untouched as a bare title.
function expandJsonLines(value: unknown): unknown[] {
  if (typeof value !== "string") return [value];
  const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [value];
  const parsed = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return line;
    }
  });
  return parsed;
}

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

  // Be maximally lenient about shape: Shortcuts collapses a one-element list
  // to a bare value (object, or even just a string with the reminder's
  // title) instead of an array. Accept anything JSON-valid, always ending up
  // with an array; junk entries are silently dropped later by normalizeItem
  // rather than rejected here — check /reminders/debug to see exactly what
  // was received if items don't show up as expected.
  const candidate =
    body && typeof body === "object" && !Array.isArray(body) && "items" in (body as object)
      ? (body as { items: unknown }).items
      : body;
  const items = (Array.isArray(candidate) ? candidate : [candidate]).flatMap(expandJsonLines);

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
