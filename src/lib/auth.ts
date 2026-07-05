// Session tokens: "<expiry>.<hmac>" signed with AUTH_SECRET.
// Uses Web Crypto only, so it runs both in the proxy (edge) and in Node.

export const SESSION_COOKIE = "eink_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function hmac(payload: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  return `${exp}.${await hmac(`session:${exp}`)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.AUTH_SECRET) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(`session:${exp}`);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function timingSafeEqual(candidate: string, real: string): boolean {
  const a = new TextEncoder().encode(candidate);
  const b = new TextEncoder().encode(real);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export function passwordMatches(candidate: string): boolean {
  const real = process.env.DASHBOARD_PASSWORD;
  if (!real) return false;
  return timingSafeEqual(candidate, real);
}

/** Verifies the shared secret used by the iOS Shortcut that pushes Reminders data. */
export function ingestTokenMatches(candidate: string): boolean {
  const real = process.env.REMINDERS_INGEST_TOKEN;
  if (!real) return false;
  return timingSafeEqual(candidate, real);
}
