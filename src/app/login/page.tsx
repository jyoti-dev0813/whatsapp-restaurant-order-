import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { isHostedDemo, isSupabaseConfigured } from "@/lib/config";
import { DEMO_ACCOUNTS } from "@/lib/demo/credentials";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const demo = !isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <p className="text-sm font-semibold text-accent">CafeBill</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          {demo
            ? isHostedDemo()
              ? "Demo mode is on. These sign-in details are public, and bills on this host can disappear."
              : "Demo mode is on. These accounts exist only on this computer."
            : "Use the account for your cafe."}
        </p>
        <div className="mt-6">
          <LoginForm
            nextPath={params.next}
            demoAccounts={demo ? DEMO_ACCOUNTS.map((account) => ({ ...account })) : null}
          />
        </div>
        <p className="mt-6 text-sm">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-accent">
            Create an account
          </Link>
        </p>
      </Card>
    </main>
  );
}
