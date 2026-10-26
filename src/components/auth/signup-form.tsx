"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Input, Label } from "@/components/ui/fields";
import { signupAction } from "@/server/auth-actions";
import type { ActionState } from "@/lib/validation/schemas";

const initial: ActionState = {};

export function SignupForm() {
  const [state, action] = useActionState(signupAction, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Your name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
        {state.fieldErrors?.fullName ? (
          <p className="text-sm text-danger">{state.fieldErrors.fullName}</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email ? <p className="text-sm text-danger">{state.fieldErrors.email}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <p className="text-xs text-muted">At least 8 characters, with a letter and a number.</p>
        {state.fieldErrors?.password ? (
          <p className="text-sm text-danger">{state.fieldErrors.password}</p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
