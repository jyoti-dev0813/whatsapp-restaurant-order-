import "server-only";

import { canManageMenu, canManageSettings } from "@/lib/auth/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { getDemoStore } from "@/lib/demo/db";
import type {
  Actor,
  CafeProfileInput,
  MenuItemInput,
  PlaceOrderInput,
  SessionUser,
} from "@/lib/domain/types";
import {
  supabaseCancelOrder,
  supabaseCreateCafe,
  supabaseCreateCategory,
  supabaseCreateInvite,
  supabaseDashboard,
  supabaseDeleteCategory,
  supabaseDeleteMenuItem,
  supabaseGetCafe,
  supabaseGetOrder,
  supabaseGetSettings,
  supabaseListCategories,
  supabaseListInvites,
  supabaseListMenu,
  supabaseListOrders,
  supabaseMarkWhatsapp,
  supabasePlaceOrder,
  supabaseRedeemInvite,
  supabaseSaveMenuItem,
  supabaseUpdateWorkspace,
} from "@/lib/supabase/repository";
import type { SettingsInput } from "@/lib/domain/types";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function inviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}

export async function loadCafe(cafeId: string) {
  if (!isSupabaseConfigured()) return getDemoStore().getCafe(cafeId);
  return supabaseGetCafe(cafeId);
}

export async function loadSettings(cafeId: string) {
  if (!isSupabaseConfigured()) return getDemoStore().getSettings(cafeId);
  return supabaseGetSettings(cafeId);
}

export async function loadMenu(cafeId: string) {
  if (!isSupabaseConfigured()) {
    return {
      categories: getDemoStore().listCategories(cafeId),
      items: getDemoStore().listMenu(cafeId),
    };
  }
  const [categories, items] = await Promise.all([
    supabaseListCategories(cafeId),
    supabaseListMenu(cafeId),
  ]);
  return { categories, items };
}

export async function loadOrders(cafeId: string, filters?: { query?: string; status?: string }) {
  if (!isSupabaseConfigured()) return getDemoStore().listOrders(cafeId, filters);
  return supabaseListOrders(cafeId, filters);
}

export async function loadOrder(cafeId: string, orderId: string) {
  if (!isSupabaseConfigured()) return getDemoStore().getOrder(cafeId, orderId);
  return supabaseGetOrder(cafeId, orderId);
}

export async function loadDashboard(cafeId: string) {
  if (!isSupabaseConfigured()) return getDemoStore().dashboard(cafeId);
  return supabaseDashboard(cafeId);
}

export async function loadInvites(actor: Actor) {
  if (!canManageSettings(actor.role)) return [];
  if (!isSupabaseConfigured()) return getDemoStore().listInvites(actor);
  return supabaseListInvites(actor.cafeId);
}

export async function registerDemoUser(input: { email: string; fullName: string; password: string }) {
  return getDemoStore().createUser(input);
}

export async function authenticateDemo(email: string, password: string) {
  return getDemoStore().authenticate(email, password);
}

export async function createCafeForUser(user: SessionUser, input: CafeProfileInput) {
  if (!isSupabaseConfigured()) return getDemoStore().createCafe(user.id, input);
  const created = await supabaseCreateCafe(input);
  if (!created.ok) return created;
  return { ok: true as const, data: { cafeId: created.data } };
}

export async function joinCafe(user: SessionUser, code: string) {
  if (!isSupabaseConfigured()) return getDemoStore().redeemInvite(user.id, code);
  return supabaseRedeemInvite(code);
}

export async function saveWorkspace(actor: Actor, profile: CafeProfileInput, settings: SettingsInput) {
  if (!canManageSettings(actor.role)) {
    return { ok: false as const, error: "Only the owner can change cafe settings." };
  }
  if (!isSupabaseConfigured()) return getDemoStore().updateWorkspace(actor, profile, settings);
  return supabaseUpdateWorkspace(actor, profile, settings);
}

export async function saveCategory(actor: Actor, name: string) {
  if (!canManageMenu(actor.role)) {
    return { ok: false as const, error: "Only the owner can change the menu." };
  }
  if (!isSupabaseConfigured()) return getDemoStore().createCategory(actor, name);
  return supabaseCreateCategory(actor, name);
}

export async function removeCategory(actor: Actor, categoryId: string) {
  if (!canManageMenu(actor.role)) {
    return { ok: false as const, error: "Only the owner can change the menu." };
  }
  if (!isSupabaseConfigured()) return getDemoStore().deleteCategory(actor, categoryId);
  return supabaseDeleteCategory(actor, categoryId);
}

export async function saveMenuItem(actor: Actor, itemId: string | null, input: MenuItemInput) {
  if (!canManageMenu(actor.role)) {
    return { ok: false as const, error: "Only the owner can change the menu." };
  }
  if (!isSupabaseConfigured()) {
    return itemId
      ? getDemoStore().updateMenuItem(actor, itemId, input)
      : getDemoStore().createMenuItem(actor, input);
  }
  return supabaseSaveMenuItem(actor, itemId, input);
}

export async function removeMenuItem(actor: Actor, itemId: string) {
  if (!canManageMenu(actor.role)) {
    return { ok: false as const, error: "Only the owner can change the menu." };
  }
  if (!isSupabaseConfigured()) return getDemoStore().deleteMenuItem(actor, itemId);
  return supabaseDeleteMenuItem(actor, itemId);
}

export async function createBill(actor: Actor, input: PlaceOrderInput) {
  if (!isSupabaseConfigured()) return getDemoStore().placeOrder(actor, input);
  return supabasePlaceOrder(actor, input);
}

export async function openWhatsapp(actor: Actor, orderId: string) {
  if (!isSupabaseConfigured()) return getDemoStore().markWhatsappOpened(actor, orderId);
  return supabaseMarkWhatsapp(actor, orderId);
}

export async function cancelBill(actor: Actor, orderId: string) {
  if (!isSupabaseConfigured()) return getDemoStore().cancelOrder(actor, orderId);
  return supabaseCancelOrder(actor, orderId);
}

export async function issueInvite(actor: Actor) {
  if (!canManageSettings(actor.role)) {
    return { ok: false as const, error: "Only the owner can invite staff." };
  }
  if (!isSupabaseConfigured()) return getDemoStore().createInvite(actor);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const code = inviteCode();
  const created = await supabaseCreateInvite(actor, code, expiresAt);
  if (!created.ok) return created;
  return { ok: true as const, data: { code } };
}
