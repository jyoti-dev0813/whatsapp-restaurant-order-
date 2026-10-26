"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { bpsToPercentInput } from "@/lib/money";
import type { Cafe, CafeSettings, StaffInvite } from "@/lib/domain/types";
import { createInviteAction, saveSettingsAction } from "@/server/settings-actions";
import type { ActionState } from "@/lib/validation/schemas";

const initial: ActionState = {};

export function SettingsManager({
  cafe,
  settings,
  invites,
  canEdit,
}: {
  cafe: Cafe;
  settings: CafeSettings;
  invites: StaffInvite[];
  canEdit: boolean;
}) {
  const [state, action] = useActionState(saveSettingsAction, initial);
  const [inviteState, inviteAction] = useActionState(createInviteAction, initial);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-semibold">Cafe and tax</h2>
        <form action={action} className="mt-4 space-y-3">
          <Field label="Cafe name" name="name" defaultValue={cafe.name} disabled={!canEdit} error={state.fieldErrors?.name} />
          <Field label="Address" name="address" defaultValue={cafe.address} disabled={!canEdit} />
          <Field label="Cafe phone" name="phone" defaultValue={cafe.phone} disabled={!canEdit} />
          <Field label="Cafe email" name="email" defaultValue={cafe.email} disabled={!canEdit} error={state.fieldErrors?.email} />
          <Field
            label="Tax percent"
            name="taxPercent"
            defaultValue={bpsToPercentInput(settings.taxRateBps)}
            disabled={!canEdit}
            error={state.fieldErrors?.taxPercent}
          />
          <Field label="Tax label" name="taxLabel" defaultValue={settings.taxLabel} disabled={!canEdit} />
          <Field label="Bill prefix" name="billPrefix" defaultValue={settings.billPrefix} disabled={!canEdit} />
          <Field
            label="WhatsApp country code"
            name="whatsappCountryCode"
            defaultValue={settings.whatsappCountryCode}
            disabled={!canEdit}
          />
          <div className="space-y-1.5">
            <Label htmlFor="receiptFooter">Receipt footer</Label>
            <Textarea
              id="receiptFooter"
              name="receiptFooter"
              defaultValue={settings.receiptFooter}
              disabled={!canEdit}
            />
          </div>
          <p className="text-xs text-muted">
            Currency is INR, stored in paise. Tax is calculated on the discounted subtotal and rounded half-up to the nearest paise. Put a GSTIN in the footer only if the cafe is registered. This app does not file tax returns.
          </p>
          {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          {canEdit ? <SubmitButton>Save settings</SubmitButton> : <p className="text-sm text-muted">Only the owner can change settings.</p>}
        </form>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Staff invite</h2>
        <p className="mt-2 text-sm text-muted">
          Create an 8 character code. A new account can join this cafe as staff. Codes expire after 7 days. No email is sent.
        </p>
        {canEdit ? (
          <form action={inviteAction} className="mt-4">
            <SubmitButton variant="secondary">Create invite code</SubmitButton>
          </form>
        ) : null}
        {inviteState.error ? <p className="mt-3 text-sm text-danger">{inviteState.error}</p> : null}
        {inviteState.notice ? <p className="mt-3 text-sm font-medium">{inviteState.notice}</p> : null}
        <ul className="mt-4 space-y-2 text-sm">
          {invites.length === 0 ? <li className="text-muted">No invite codes yet.</li> : null}
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2">
              <span className="font-mono">{invite.code}</span>
              <span className="text-muted">{invite.usedBy ? "Used" : "Active"}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
  error,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} disabled={disabled} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
