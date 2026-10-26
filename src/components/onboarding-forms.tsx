"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/fields";
import { createCafeAction, joinCafeAction } from "@/server/auth-actions";
import type { ActionState } from "@/lib/validation/schemas";

const initial: ActionState = {};

export function OnboardingForms() {
  const [createState, createAction] = useActionState(createCafeAction, initial);
  const [joinState, joinAction] = useActionState(joinCafeAction, initial);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
      <Card>
        <h1 className="text-2xl font-semibold">Create a cafe</h1>
        <p className="mt-2 text-sm text-muted">You become the owner of this cafe.</p>
        <form action={createAction} className="mt-4 space-y-3">
          <Field name="name" label="Cafe name" error={createState.fieldErrors?.name} />
          <Field name="address" label="Address" />
          <Field name="phone" label="Phone" />
          <Field name="email" label="Email" error={createState.fieldErrors?.email} />
          {createState.error ? <p className="text-sm text-danger">{createState.error}</p> : null}
          <SubmitButton>Create cafe</SubmitButton>
        </form>
      </Card>
      <Card>
        <h2 className="text-2xl font-semibold">Join with a code</h2>
        <p className="mt-2 text-sm text-muted">Ask the owner for an invite code. You join as staff.</p>
        <form action={joinAction} className="mt-4 space-y-3">
          <Field name="code" label="Invite code" error={joinState.fieldErrors?.code} />
          {joinState.error ? <p className="text-sm text-danger">{joinState.error}</p> : null}
          <SubmitButton variant="secondary">Join cafe</SubmitButton>
        </form>
      </Card>
    </div>
  );
}

function Field({ name, label, error }: { name: string; label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
