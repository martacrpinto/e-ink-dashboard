import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  for (const tag of ["notion", "calendar", "reminders", "weather"]) {
    // expire immediately so the reload right after gets fresh data
    revalidateTag(tag, { expire: 0 });
  }
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
