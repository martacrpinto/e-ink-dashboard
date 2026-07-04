import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  passwordMatches,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "../../lib/auth";

export const metadata = { title: "Entrar — Dashboard" };

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  if (!passwordMatches(password)) {
    redirect(`/login?error=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(next.startsWith("/") ? next : "/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={login}
        className="w-full max-w-sm border-2 border-rule-strong bg-paper-raised p-8"
      >
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">
          e-ink dashboard
        </h1>
        <p className="mt-2 text-2xl font-semibold">Entrar</p>
        <input type="hidden" name="next" value={next ?? "/"} />
        <label className="mt-6 block text-sm text-ink-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          className="mt-1 w-full border-2 border-rule bg-paper px-3 py-2 outline-none focus:border-rule-strong"
        />
        {error ? (
          <p className="mt-3 border-l-4 border-rule-strong pl-3 text-sm text-ink-2">
            Password errada. Tenta outra vez.
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-6 w-full border-2 border-rule-strong bg-ink px-3 py-2 font-semibold text-paper hover:opacity-80"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
