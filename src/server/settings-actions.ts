"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageSettings } from "@/lib/auth/permissions";
import { percentToBps } from "@/lib/money";
import { cleanText } from "@/lib/text";
import { fieldErrorsFrom, settingsSchema, type ActionState } from "@/lib/validation/schemas";
import { issueInvite, saveWorkspace } from "@/server/data";
import { requireActor } from "@/server/session";

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    taxPercent: formData.get("taxPercent"),
    taxLabel: formData.get("taxLabel"),
    billPrefix: formData.get("billPrefix"),
    whatsappCountryCode: formData.get("whatsappCountryCode"),
    receiptFooter: formData.get("receiptFooter") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const tax = percentToBps(parsed.data.taxPercent);
  if (!tax.ok) return { error: tax.error };

  const actor = await requireActor();
  if (!canManageSettings(actor.role)) return { error: "Only the owner can change cafe settings." };
  const saved = await saveWorkspace(
    actor,
    {
      name: cleanText(parsed.data.name, 80),
      address: cleanText(parsed.data.address, 200),
      phone: cleanText(parsed.data.phone, 20),
      email: parsed.data.email,
    },
    {
      taxRateBps: tax.bps,
      taxLabel: cleanText(parsed.data.taxLabel, 20),
      receiptFooter: cleanText(parsed.data.receiptFooter, 240),
      billPrefix: parsed.data.billPrefix,
      whatsappCountryCode: parsed.data.whatsappCountryCode,
    },
  );
  if (!saved.ok) return { error: saved.error };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings");
}

export async function createInviteAction(previous: ActionState): Promise<ActionState> {
  void previous;
  const actor = await requireActor();
  const created = await issueInvite(actor);
  if (!created.ok) return { error: created.error };
  revalidatePath("/settings");
  return { notice: `Invite code ${created.data.code}. It expires in 7 days.` };
}
