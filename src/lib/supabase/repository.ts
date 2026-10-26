import "server-only";

import { summarizeOrders } from "@/lib/billing/dashboard";
import type {
  Actor,
  Cafe,
  CafeProfileInput,
  CafeSettings,
  DashboardStats,
  MenuCategory,
  MenuItem,
  MenuItemInput,
  OrderDetail,
  OrderItem,
  OrderStatus,
  OrderSummary,
  PlaceOrderInput,
  Result,
  SettingsInput,
  StaffInvite,
} from "@/lib/domain/types";
import { cleanText } from "@/lib/text";
import { normalizePhone } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Money = number | string;

type OrderRow = {
  id: string;
  cafe_id: string;
  bill_number: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  subtotal_paise: Money;
  discount_paise: Money;
  tax_paise: Money;
  total_paise: Money;
  tax_rate_bps: number;
  tax_label: string;
  receipt_footer: string;
  cafe_name: string;
  cafe_address: string;
  cafe_phone: string;
  notes: string;
  created_by: string;
  client_request_id: string;
  whatsapp_opened_at: string | null;
  created_at: string;
};

type ItemRow = {
  id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  price_paise: Money;
  quantity: number;
  line_total_paise: Money;
};

function money(value: Money): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error("Stored amount is outside the supported range.");
  }
  return parsed;
}

function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("customer name")) return "Enter the customer name (2–80 characters).";
  if (lower.includes("phone")) return "Enter a valid phone number or leave it blank.";
  if (lower.includes("discount")) return "Discount cannot be more than the subtotal.";
  if (lower.includes("unavailable")) return "One of the items is no longer available.";
  if (lower.includes("not found")) return "That item is not on this cafe menu.";
  if (lower.includes("quantity")) return "Quantity must be a whole number from 1 to 99.";
  if (lower.includes("duplicate")) return "Each item can only appear once. Change the quantity instead.";
  if (lower.includes("too many")) return "An order can include at most 40 lines.";
  if (lower.includes("invite")) return "That invite code is not valid.";
  if (lower.includes("already in a cafe")) return "This account already belongs to a cafe.";
  if (lower.includes("permission") || lower.includes("row-level") || lower.includes("rls")) {
    return "You do not have permission to do that.";
  }
  if (lower.includes("jwt") || lower.includes("not authenticated")) {
    return "Your session expired. Sign in again.";
  }
  return "The request could not be completed. Try again.";
}

function mapSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    cafeId: row.cafe_id,
    billNumber: row.bill_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    status: row.status,
    subtotalPaise: money(row.subtotal_paise),
    discountPaise: money(row.discount_paise),
    taxPaise: money(row.tax_paise),
    totalPaise: money(row.total_paise),
    taxRateBps: row.tax_rate_bps,
    taxLabel: row.tax_label,
    receiptFooter: row.receipt_footer,
    cafeName: row.cafe_name,
    cafeAddress: row.cafe_address,
    cafePhone: row.cafe_phone,
    notes: row.notes,
    createdBy: row.created_by,
    clientRequestId: row.client_request_id,
    whatsappOpenedAt: row.whatsapp_opened_at,
    createdAt: row.created_at,
  };
}

function mapItem(row: ItemRow): OrderItem {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    name: row.name_snapshot,
    pricePaise: money(row.price_paise),
    quantity: row.quantity,
    lineTotalPaise: money(row.line_total_paise),
  };
}

async function client() {
  return createSupabaseServerClient();
}

export async function supabaseGetCafe(cafeId: string): Promise<Cafe | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("cafes")
    .select("id, name, address, phone, email, created_at, updated_at")
    .eq("id", cafeId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
    email: data.email,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function supabaseGetSettings(cafeId: string): Promise<CafeSettings | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("cafe_settings")
    .select("*")
    .eq("cafe_id", cafeId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    cafeId: data.cafe_id,
    currencyCode: "INR",
    taxRateBps: data.tax_rate_bps,
    taxLabel: data.tax_label,
    receiptFooter: data.receipt_footer,
    billPrefix: data.bill_prefix,
    nextBillSeq: data.next_bill_seq,
    whatsappCountryCode: data.whatsapp_country_code,
    updatedAt: data.updated_at,
  };
}

export async function supabaseUpdateWorkspace(
  actor: Actor,
  profile: CafeProfileInput,
  settings: SettingsInput,
): Promise<Result<true>> {
  const supabase = await client();
  const cafe = await supabase
    .from("cafes")
    .update({
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
    })
    .eq("id", actor.cafeId);
  if (cafe.error) return { ok: false, error: friendlyDbError(cafe.error.message) };
  const saved = await supabase
    .from("cafe_settings")
    .update({
      tax_rate_bps: settings.taxRateBps,
      tax_label: settings.taxLabel,
      receipt_footer: settings.receiptFooter,
      bill_prefix: settings.billPrefix,
      whatsapp_country_code: settings.whatsappCountryCode,
    })
    .eq("cafe_id", actor.cafeId);
  if (saved.error) return { ok: false, error: friendlyDbError(saved.error.message) };
  return { ok: true, data: true };
}

export async function supabaseListCategories(cafeId: string): Promise<MenuCategory[]> {
  const supabase = await client();
  const { data } = await supabase
    .from("menu_categories")
    .select("id, cafe_id, name, sort_order, created_at")
    .eq("cafe_id", cafeId)
    .order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id,
    cafeId: row.cafe_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}

export async function supabaseCreateCategory(actor: Actor, name: string): Promise<Result<true>> {
  const supabase = await client();
  const { error } = await supabase.from("menu_categories").insert({
    cafe_id: actor.cafeId,
    name: cleanText(name, 40),
    sort_order: Date.now() % 1_000_000,
  });
  if (error) return { ok: false, error: friendlyDbError(error.message) };
  return { ok: true, data: true };
}

export async function supabaseDeleteCategory(actor: Actor, categoryId: string): Promise<Result<true>> {
  const supabase = await client();
  const cleared = await supabase
    .from("menu_items")
    .update({ category_id: null })
    .eq("cafe_id", actor.cafeId)
    .eq("category_id", categoryId);
  if (cleared.error) return { ok: false, error: friendlyDbError(cleared.error.message) };
  const removed = await supabase
    .from("menu_categories")
    .delete()
    .eq("cafe_id", actor.cafeId)
    .eq("id", categoryId);
  if (removed.error) return { ok: false, error: friendlyDbError(removed.error.message) };
  return { ok: true, data: true };
}

export async function supabaseListMenu(cafeId: string): Promise<MenuItem[]> {
  const supabase = await client();
  const { data } = await supabase
    .from("menu_items")
    .select("id, cafe_id, category_id, name, description, price_paise, is_available, created_at, updated_at")
    .eq("cafe_id", cafeId)
    .order("name");
  return (data ?? []).map((row) => ({
    id: row.id,
    cafeId: row.cafe_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    pricePaise: money(row.price_paise),
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function supabaseSaveMenuItem(
  actor: Actor,
  itemId: string | null,
  input: MenuItemInput,
): Promise<Result<true>> {
  const supabase = await client();
  const payload = {
    cafe_id: actor.cafeId,
    category_id: input.categoryId,
    name: input.name,
    description: input.description,
    price_paise: input.pricePaise,
    is_available: input.isAvailable,
  };
  const result = itemId
    ? await supabase.from("menu_items").update(payload).eq("id", itemId).eq("cafe_id", actor.cafeId)
    : await supabase.from("menu_items").insert(payload);
  if (result.error) return { ok: false, error: friendlyDbError(result.error.message) };
  return { ok: true, data: true };
}

export async function supabaseDeleteMenuItem(actor: Actor, itemId: string): Promise<Result<true>> {
  const supabase = await client();
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId).eq("cafe_id", actor.cafeId);
  if (error) return { ok: false, error: friendlyDbError(error.message) };
  return { ok: true, data: true };
}

export async function supabaseListOrders(
  cafeId: string,
  filters?: { query?: string; status?: string },
): Promise<OrderSummary[]> {
  const supabase = await client();
  let request = supabase
    .from("orders")
    .select("*")
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (filters?.status && filters.status !== "all") {
    request = request.eq("status", filters.status);
  }
  const query = filters?.query?.replace(/[%_,().]/g, "").trim().slice(0, 40);
  if (query) {
    request = request.or(
      `bill_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`,
    );
  }
  const { data, error } = await request;
  if (error || !data) return [];
  return (data as OrderRow[]).map(mapSummary);
}

export async function supabaseGetOrder(cafeId: string, orderId: string): Promise<OrderDetail | null> {
  const supabase = await client();
  const orderResult = await supabase
    .from("orders")
    .select("*")
    .eq("cafe_id", cafeId)
    .eq("id", orderId)
    .maybeSingle();
  if (orderResult.error || !orderResult.data) return null;
  const itemsResult = await supabase
    .from("order_items")
    .select("id, menu_item_id, name_snapshot, price_paise, quantity, line_total_paise")
    .eq("cafe_id", cafeId)
    .eq("order_id", orderId);
  if (itemsResult.error) return null;
  return {
    ...mapSummary(orderResult.data as OrderRow),
    items: ((itemsResult.data ?? []) as ItemRow[]).map(mapItem),
  };
}

export async function supabasePlaceOrder(actor: Actor, input: PlaceOrderInput): Promise<Result<OrderDetail>> {
  const settings = await supabaseGetSettings(actor.cafeId);
  if (!settings) return { ok: false, error: "Cafe settings are missing." };
  let customerPhone = "";
  if (input.customerPhone.trim()) {
    const phone = normalizePhone(input.customerPhone, settings.whatsappCountryCode);
    if (!phone.ok) return phone;
    customerPhone = phone.e164Digits;
  }
  const supabase = await client();
  const { data, error } = await supabase.rpc("place_order", {
    p_payload: {
      clientRequestId: input.clientRequestId,
      customerName: cleanText(input.customerName, 80),
      customerPhone,
      discountPaise: input.discountPaise,
      notes: cleanText(input.notes, 300),
      items: input.items,
    },
  });
  if (error) return { ok: false, error: friendlyDbError(error.message) };
  const orderId = (data as { orderId?: string } | null)?.orderId;
  if (!orderId) return { ok: false, error: "The bill could not be saved." };
  const order = await supabaseGetOrder(actor.cafeId, orderId);
  if (!order) return { ok: false, error: "The bill was saved but could not be loaded." };
  return { ok: true, data: order };
}

export async function supabaseMarkWhatsapp(actor: Actor, orderId: string): Promise<Result<OrderDetail>> {
  const supabase = await client();
  const { error } = await supabase.rpc("mark_whatsapp_opened", { p_order_id: orderId });
  if (error) return { ok: false, error: friendlyDbError(error.message) };
  const order = await supabaseGetOrder(actor.cafeId, orderId);
  if (!order) return { ok: false, error: "Bill not found." };
  return { ok: true, data: order };
}

export async function supabaseCancelOrder(actor: Actor, orderId: string): Promise<Result<OrderDetail>> {
  const supabase = await client();
  const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
  if (error) return { ok: false, error: friendlyDbError(error.message) };
  const order = await supabaseGetOrder(actor.cafeId, orderId);
  if (!order) return { ok: false, error: "Bill not found." };
  return { ok: true, data: order };
}

export async function supabaseCreateInvite(actor: Actor, code: string, expiresAt: string): Promise<Result<true>> {
  const supabase = await client();
  const { error } = await supabase.from("staff_invites").insert({
    cafe_id: actor.cafeId,
    code,
    role: "staff",
    created_by: actor.id,
    expires_at: expiresAt,
  });
  if (error) return { ok: false, error: friendlyDbError(error.message) };
  return { ok: true, data: true };
}

export async function supabaseListInvites(cafeId: string): Promise<StaffInvite[]> {
  const supabase = await client();
  const { data } = await supabase
    .from("staff_invites")
    .select("id, cafe_id, code, role, created_by, expires_at, used_by, used_at, created_at")
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    cafeId: row.cafe_id,
    code: row.code,
    role: "staff" as const,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    usedBy: row.used_by,
    usedAt: row.used_at,
    createdAt: row.created_at,
  }));
}

export async function supabaseCreateCafe(input: CafeProfileInput): Promise<Result<string>> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("create_cafe", {
    p_name: input.name,
    p_address: input.address,
    p_phone: input.phone,
    p_email: input.email,
  });
  if (error || !data) return { ok: false, error: friendlyDbError(error?.message ?? "Could not create the cafe.") };
  return { ok: true, data: String(data) };
}

export async function supabaseRedeemInvite(code: string): Promise<Result<string>> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("redeem_invite", { p_code: code });
  if (error || !data) return { ok: false, error: friendlyDbError(error?.message ?? "That invite code is not valid.") };
  return { ok: true, data: String(data) };
}

export async function supabaseDashboard(cafeId: string): Promise<DashboardStats> {
  const orders = await supabaseListOrders(cafeId);
  return summarizeOrders(orders);
}
