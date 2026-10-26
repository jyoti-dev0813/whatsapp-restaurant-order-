"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Input, Label } from "@/components/ui/fields";
import { loginAction } from "@/server/auth-actions";
import type { ActionState } from "@/lib/validation/schemas";

const initial: ActionState = {};

export function LoginForm({
  nextPath,
  demoAccounts,
}: {
  nextPath?: string;
  demoAccounts: { role: string; cafe: string; email: string; password: string }[] | null;
}) {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="nextPath" value={nextPath ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
        {state.fieldErrors?.email ? <p className="text-sm text-danger">{state.fieldErrors.email}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-danger">{state.fieldErrors.password}</p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <SubmitButton>Sign in</SubmitButton>
      {demoAccounts ? (
        <div className="rounded-xl bg-background p-3 text-sm text-muted">
          <p className="font-medium text-foreground">Local demo accounts</p>
          <ul className="mt-2 space-y-1">
            {demoAccounts.map((account) => (
              <li key={account.email}>
                {account.cafe} {account.role}: {account.email} / {account.password}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
