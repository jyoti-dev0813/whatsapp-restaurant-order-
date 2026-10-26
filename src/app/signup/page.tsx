import Link from "next/link";
import { connection } from "next/server";

import { SignupForm } from "@/components/auth/signup-form";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/config";

export default async function SignupPage() {
  await connection();
  const demo = !isSupabaseConfigured();
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <p className="text-sm font-semibold text-accent">CafeBill</p>
        <h1 className="mt-2 text-2xl font-semibold">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          {demo
            ? "This account is saved in the local demo file, not in Supabase."
            : "After signup you can create a cafe or join one with an invite code."}
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
        <p className="mt-6 text-sm">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-accent">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
