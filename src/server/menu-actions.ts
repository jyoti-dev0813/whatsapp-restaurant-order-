"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageMenu } from "@/lib/auth/permissions";
import { rupeesToPaise } from "@/lib/money";
import { cleanText } from "@/lib/text";
import {
  categorySchema,
  fieldErrorsFrom,
  menuItemSchema,
  type ActionState,
} from "@/lib/validation/schemas";
import { removeCategory, removeMenuItem, saveCategory, saveMenuItem } from "@/server/data";
import { requireActor } from "@/server/session";

function refreshMenu() {
  revalidatePath("/menu");
  revalidatePath("/orders/new");
}

export async function saveMenuItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = menuItemSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    priceRupees: formData.get("priceRupees"),
    isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const price = rupeesToPaise(parsed.data.priceRupees);
  if (!price.ok) return { error: price.error };
  if (price.paise > 10_000_000) return { error: "Price cannot be more than ₹1,00,000." };

  const actor = await requireActor();
  if (!canManageMenu(actor.role)) return { error: "Only the owner can change the menu." };
  const saved = await saveMenuItem(actor, parsed.data.id || null, {
    categoryId: parsed.data.categoryId || null,
    name: cleanText(parsed.data.name, 80),
    description: cleanText(parsed.data.description, 160),
    pricePaise: price.paise,
    isAvailable: parsed.data.isAvailable === "true",
  });
  if (!saved.ok) return { error: saved.error };
  refreshMenu();
  redirect("/menu");
}

export async function deleteMenuItemAction(formData: FormData) {
  const actor = await requireActor();
  await removeMenuItem(actor, String(formData.get("id") ?? ""));
  refreshMenu();
  redirect("/menu");
}

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const actor = await requireActor();
  const created = await saveCategory(actor, parsed.data.name);
  if (!created.ok) return { error: created.error };
  refreshMenu();
  redirect("/menu");
}

export async function deleteCategoryAction(formData: FormData) {
  const actor = await requireActor();
  await removeCategory(actor, String(formData.get("id") ?? ""));
  refreshMenu();
  redirect("/menu");
}
