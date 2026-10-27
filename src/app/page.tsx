import Link from "next/link";
import { connection } from "next/server";

import { appMode, isHostedDemo } from "@/lib/config";

export default async function HomePage() {
  await connection();
  const mode = appMode();

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="text-lg font-semibold">CafeBill</p>
        <div className="flex gap-2">
          <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
          >
            Create account
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col justify-center py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cafe and restaurant billing</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Take an order, print the bill, and open WhatsApp with the total ready.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          Each cafe keeps its own menu, staff, customers, and bills. Totals are calculated on the server in paise. WhatsApp uses a free click-to-chat link, and a person still has to press Send.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground"
          >
            Open the counter
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-semibold"
          >
            Register a cafe
          </Link>
        </div>
        {mode === "demo" ? (
          <p className="mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {isHostedDemo()
              ? "Supabase is not configured, so this copy is in demo mode. Bills are kept in temporary server memory and can disappear. They are not written to Supabase. The demo sign-in details are public."
              : "Supabase is not configured, so this copy is in demo mode. Sign in with a local demo account. Data stays in a file on this computer and is not written to Supabase."}
          </p>
        ) : (
          <p className="mt-8 text-sm text-muted">Connected to Supabase. Cafe data is stored in your free project.</p>
        )}
      </main>
    </div>
  );
}
