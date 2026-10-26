"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { rupeesToPaise } from "@/lib/money";
import { cleanText } from "@/lib/text";
import { fieldErrorsFrom, placeOrderSchema } from "@/lib/validation/schemas";
import { cancelBill, createBill, openWhatsapp } from "@/server/data";
import { requireActor } from "@/server/session";

export async function placeOrderAction(input: unknown) {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrorsFrom(parsed.error);
    return {
      ok: false as const,
      error: Object.values(fields)[0] ?? "Check the order and try again.",
    };
  }
  const discount = rupeesToPaise(parsed.data.discountRupees, { allowEmpty: true });
  if (!discount.ok) return discount;

  const actor = await requireActor();
  const result = await createBill(actor, {
    clientRequestId: parsed.data.clientRequestId,
    customerName: cleanText(parsed.data.customerName, 80),
    customerPhone: parsed.data.customerPhone,
    discountPaise: discount.paise,
    notes: cleanText(parsed.data.notes, 300),
    items: parsed.data.items,
  });
  if (!result.ok) return result;
  revalidatePath("/dashboard");
  revalidatePath("/orders");
  return { ok: true as const, orderId: result.data.id };
}

export async function markWhatsappOpenedAction(orderId: string) {
  const actor = await requireActor();
  const result = await openWhatsapp(actor, orderId);
  if (!result.ok) return result;
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true as const };
}

export async function cancelOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const actor = await requireActor();
  await cancelBill(actor, orderId);
  revalidatePath("/dashboard");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${orderId}`);
}
