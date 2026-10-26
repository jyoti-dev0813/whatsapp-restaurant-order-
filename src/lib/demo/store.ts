import { summarizeOrders } from "@/lib/billing/dashboard";
import { formatBillNumber } from "@/lib/billing/bill-number";
import { calculateBill } from "@/lib/billing/calculate";
import { canBill, canManageMenu, canManageSettings } from "@/lib/auth/permissions";
import { defaultCafeSettings } from "@/lib/demo/defaults";
import { hashPassword, verifyPassword } from "@/lib/demo/passwords";
import type { DemoDatabase, DemoUser } from "@/lib/demo/types";
import type {
  Actor,
  CafeProfileInput,
  DashboardStats,
  MenuItemInput,
  OrderDetail,
  OrderSummary,
  PlaceOrderInput,
  Result,
  SessionUser,
  SettingsInput,
} from "@/lib/domain/types";
import { normalizePhone } from "@/lib/phone";
import { cleanText } from "@/lib/text";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function toSessionUser(user: DemoUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    cafeId: user.cafeId,
    role: user.role,
  };
}

function summary(order: OrderDetail): OrderSummary {
  const { items, ...rest } = order;
  void items;
  return rest;
}

function actorOf(user: DemoUser): Actor | null {
  if (!user.cafeId || !user.role) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    cafeId: user.cafeId,
    role: user.role,
  };
}

export function createMemoryStore(
  initial: DemoDatabase,
  options?: { onChange?: (db: DemoDatabase) => void },
) {
  const db = initial;

  function commit() {
    options?.onChange?.(clone(db));
  }

  function requireActor(userId: string): Result<Actor> {
    const user = db.users.find((entry) => entry.id === userId);
    if (!user) return { ok: false, error: "Account not found." };
    const actor = actorOf(user);
    if (!actor) return { ok: false, error: "Create or join a cafe first." };
    return { ok: true, data: actor };
  }

  return {
    findUserById(id: string) {
      const user = db.users.find((entry) => entry.id === id);
      return user ? toSessionUser(user) : null;
    },

    authenticate(email: string, password: string): Result<SessionUser> {
      const user = db.users.find((entry) => entry.email === email.toLowerCase());
      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        return { ok: false, error: "Email or password is incorrect." };
      }
      return { ok: true, data: toSessionUser(user) };
    },

    createUser(input: {
      email: string;
      fullName: string;
      password: string;
    }): Result<SessionUser> {
      const email = input.email.toLowerCase();
      if (db.users.some((entry) => entry.email === email)) {
        return { ok: false, error: "An account with this email already exists." };
      }
      const hashed = hashPassword(input.password);
      const user: DemoUser = {
        id: crypto.randomUUID(),
        email,
        fullName: cleanText(input.fullName, 80),
        passwordSalt: hashed.salt,
        passwordHash: hashed.hash,
        cafeId: null,
        role: null,
        createdAt: nowIso(),
      };
      db.users.push(user);
      commit();
      return { ok: true, data: toSessionUser(user) };
    },

    createCafe(userId: string, input: CafeProfileInput): Result<Actor> {
      const user = db.users.find((entry) => entry.id === userId);
      if (!user) return { ok: false, error: "Account not found." };
      if (user.cafeId) return { ok: false, error: "This account already belongs to a cafe." };
      const name = cleanText(input.name, 80);
      if (name.length < 2) return { ok: false, error: "Enter the cafe name." };
      const stamp = nowIso();
      const cafeId = crypto.randomUUID();
      db.cafes.push({
        id: cafeId,
        name,
        address: cleanText(input.address, 200),
        phone: cleanText(input.phone, 20),
        email: input.email.trim().toLowerCase(),
        createdAt: stamp,
        updatedAt: stamp,
      });
      db.settings.push(defaultCafeSettings(cafeId, stamp));
      user.cafeId = cafeId;
      user.role = "owner";
      commit();
      return { ok: true, data: actorOf(user)! };
    },

    redeemInvite(userId: string, code: string): Result<Actor> {
      const user = db.users.find((entry) => entry.id === userId);
      if (!user) return { ok: false, error: "Account not found." };
      if (user.cafeId) return { ok: false, error: "This account already belongs to a cafe." };
      const invite = db.invites.find((entry) => entry.code === code.toUpperCase());
      if (!invite || invite.usedBy || new Date(invite.expiresAt).getTime() < Date.now()) {
        return { ok: false, error: "That invite code is not valid." };
      }
      invite.usedBy = user.id;
      invite.usedAt = nowIso();
      user.cafeId = invite.cafeId;
      user.role = "staff";
      commit();
      return { ok: true, data: actorOf(user)! };
    },

    getCafe(cafeId: string) {
      const cafe = db.cafes.find((entry) => entry.id === cafeId);
      return cafe ? clone(cafe) : null;
    },

    getSettings(cafeId: string) {
      const settings = db.settings.find((entry) => entry.cafeId === cafeId);
      return settings ? clone(settings) : null;
    },

    updateWorkspace(
      actor: Actor,
      profile: CafeProfileInput,
      settingsInput: SettingsInput,
    ): Result<true> {
      if (!canManageSettings(actor.role)) {
        return { ok: false, error: "Only the owner can change cafe settings." };
      }
      const cafe = db.cafes.find((entry) => entry.id === actor.cafeId);
      const settings = db.settings.find((entry) => entry.cafeId === actor.cafeId);
      if (!cafe || !settings) return { ok: false, error: "Cafe not found." };
      const name = cleanText(profile.name, 80);
      if (name.length < 2) return { ok: false, error: "Enter the cafe name." };
      if (!/^[A-Z0-9]{2,8}$/.test(settingsInput.billPrefix)) {
        return { ok: false, error: "Bill prefix must be 2 to 8 letters or numbers." };
      }
      if (!/^[1-9]\d{0,3}$/.test(settingsInput.whatsappCountryCode)) {
        return { ok: false, error: "Country code is invalid." };
      }
      const stamp = nowIso();
      cafe.name = name;
      cafe.address = cleanText(profile.address, 200);
      cafe.phone = cleanText(profile.phone, 20);
      cafe.email = profile.email.trim().toLowerCase();
      cafe.updatedAt = stamp;
      settings.taxRateBps = settingsInput.taxRateBps;
      settings.taxLabel = cleanText(settingsInput.taxLabel, 20);
      settings.receiptFooter = cleanText(settingsInput.receiptFooter, 240);
      settings.billPrefix = settingsInput.billPrefix;
      settings.whatsappCountryCode = settingsInput.whatsappCountryCode;
      settings.updatedAt = stamp;
      commit();
      return { ok: true, data: true };
    },

    listCategories(cafeId: string) {
      return db.categories
        .filter((entry) => entry.cafeId === cafeId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((entry) => clone(entry));
    },

    createCategory(actor: Actor, name: string): Result<{ id: string }> {
      if (!canManageMenu(actor.role)) {
        return { ok: false, error: "Only the owner can change the menu." };
      }
      const clean = cleanText(name, 40);
      if (!clean) return { ok: false, error: "Enter a category name." };
      const sortOrder =
        db.categories
          .filter((entry) => entry.cafeId === actor.cafeId)
          .reduce((max, entry) => Math.max(max, entry.sortOrder), 0) + 1;
      const id = crypto.randomUUID();
      db.categories.push({
        id,
        cafeId: actor.cafeId,
        name: clean,
        sortOrder,
        createdAt: nowIso(),
      });
      commit();
      return { ok: true, data: { id } };
    },

    deleteCategory(actor: Actor, categoryId: string): Result<true> {
      if (!canManageMenu(actor.role)) {
        return { ok: false, error: "Only the owner can change the menu." };
      }
      const index = db.categories.findIndex(
        (entry) => entry.id === categoryId && entry.cafeId === actor.cafeId,
      );
      if (index < 0) return { ok: false, error: "Category not found." };
      db.categories.splice(index, 1);
      for (const item of db.items) {
        if (item.cafeId === actor.cafeId && item.categoryId === categoryId) {
          item.categoryId = null;
        }
      }
      commit();
      return { ok: true, data: true };
    },

    listMenu(cafeId: string) {
      return db.items
        .filter((entry) => entry.cafeId === cafeId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((entry) => clone(entry));
    },

    createMenuItem(actor: Actor, input: MenuItemInput): Result<{ id: string }> {
      if (!canManageMenu(actor.role)) {
        return { ok: false, error: "Only the owner can change the menu." };
      }
      const name = cleanText(input.name, 80);
      if (!name) return { ok: false, error: "Enter an item name." };
      if (input.categoryId && !db.categories.some((entry) => entry.id === input.categoryId && entry.cafeId === actor.cafeId)) {
        return { ok: false, error: "Choose a category from this cafe." };
      }
      const stamp = nowIso();
      const id = crypto.randomUUID();
      db.items.push({
        id,
        cafeId: actor.cafeId,
        categoryId: input.categoryId,
        name,
        description: cleanText(input.description, 160),
        pricePaise: input.pricePaise,
        isAvailable: input.isAvailable,
        createdAt: stamp,
        updatedAt: stamp,
      });
      commit();
      return { ok: true, data: { id } };
    },

    updateMenuItem(actor: Actor, itemId: string, input: MenuItemInput): Result<true> {
      if (!canManageMenu(actor.role)) {
        return { ok: false, error: "Only the owner can change the menu." };
      }
      const item = db.items.find((entry) => entry.id === itemId && entry.cafeId === actor.cafeId);
      if (!item) return { ok: false, error: "Menu item not found." };
      if (input.categoryId && !db.categories.some((entry) => entry.id === input.categoryId && entry.cafeId === actor.cafeId)) {
        return { ok: false, error: "Choose a category from this cafe." };
      }
      item.name = cleanText(input.name, 80);
      item.description = cleanText(input.description, 160);
      item.pricePaise = input.pricePaise;
      item.isAvailable = input.isAvailable;
      item.categoryId = input.categoryId;
      item.updatedAt = nowIso();
      commit();
      return { ok: true, data: true };
    },

    deleteMenuItem(actor: Actor, itemId: string): Result<true> {
      if (!canManageMenu(actor.role)) {
        return { ok: false, error: "Only the owner can change the menu." };
      }
      const index = db.items.findIndex((entry) => entry.id === itemId && entry.cafeId === actor.cafeId);
      if (index < 0) return { ok: false, error: "Menu item not found." };
      db.items.splice(index, 1);
      for (const order of db.orders) {
        if (order.cafeId !== actor.cafeId) continue;
        for (const line of order.items) {
          if (line.menuItemId === itemId) line.menuItemId = null;
        }
      }
      commit();
      return { ok: true, data: true };
    },

    listOrders(cafeId: string, filters?: { query?: string; status?: string }) {
      const query = filters?.query?.trim().toLowerCase() ?? "";
      const status = filters?.status ?? "all";
      return db.orders
        .filter((order) => order.cafeId === cafeId)
        .filter((order) => (status === "all" ? true : order.status === status))
        .filter((order) => {
          if (!query) return true;
          return `${order.billNumber} ${order.customerName} ${order.customerPhone}`
            .toLowerCase()
            .includes(query);
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((order) => summary(clone(order)));
    },

    getOrder(cafeId: string, orderId: string) {
      const order = db.orders.find((entry) => entry.id === orderId && entry.cafeId === cafeId);
      return order ? clone(order) : null;
    },

    placeOrder(actor: Actor, input: PlaceOrderInput, now = new Date()): Result<OrderDetail> {
      if (!canBill(actor.role)) return { ok: false, error: "You cannot create bills." };
      if (!UUID_PATTERN.test(input.clientRequestId)) {
        return { ok: false, error: "Order request is invalid. Refresh and try again." };
      }
      const existing = db.orders.find(
        (order) => order.cafeId === actor.cafeId && order.clientRequestId === input.clientRequestId,
      );
      if (existing) return { ok: true, data: clone(existing) };

      const customerName = cleanText(input.customerName, 80);
      if (customerName.length < 2) return { ok: false, error: "Enter the customer name." };
      const settings = db.settings.find((entry) => entry.cafeId === actor.cafeId);
      const cafe = db.cafes.find((entry) => entry.id === actor.cafeId);
      if (!settings || !cafe) return { ok: false, error: "Cafe settings are missing." };

      let customerPhone = "";
      if (input.customerPhone.trim()) {
        const phone = normalizePhone(input.customerPhone, settings.whatsappCountryCode);
        if (!phone.ok) return phone;
        customerPhone = phone.e164Digits;
      }

      if (input.items.length === 0) return { ok: false, error: "Add at least one item." };
      const seen = new Set<string>();
      const priced: { menuItemId: string; name: string; pricePaise: number; quantity: number }[] = [];
      for (const line of input.items) {
        if (seen.has(line.menuItemId)) {
          return { ok: false, error: "Each item can only appear once. Change the quantity instead." };
        }
        seen.add(line.menuItemId);
        const item = db.items.find(
          (entry) => entry.id === line.menuItemId && entry.cafeId === actor.cafeId,
        );
        if (!item) return { ok: false, error: "That item is not on this cafe menu." };
        if (!item.isAvailable) return { ok: false, error: `${item.name} is unavailable.` };
        priced.push({
          menuItemId: item.id,
          name: item.name,
          pricePaise: item.pricePaise,
          quantity: line.quantity,
        });
      }

      const totals = calculateBill({
        lines: priced.map((line) => ({ pricePaise: line.pricePaise, quantity: line.quantity })),
        discountPaise: input.discountPaise,
        taxRateBps: settings.taxRateBps,
      });
      if (!totals.ok) return totals;

      const stamp = now.toISOString();
      if (customerPhone) {
        const found = db.customers.find(
          (entry) => entry.cafeId === actor.cafeId && entry.phoneE164 === customerPhone,
        );
        if (found) {
          found.name = customerName;
          found.updatedAt = stamp;
        } else {
          db.customers.push({
            id: crypto.randomUUID(),
            cafeId: actor.cafeId,
            name: customerName,
            phoneE164: customerPhone,
            createdAt: stamp,
            updatedAt: stamp,
          });
        }
      }

      const sequence = settings.nextBillSeq;
      settings.nextBillSeq += 1;
      const order: OrderDetail = {
        id: crypto.randomUUID(),
        cafeId: actor.cafeId,
        billNumber: formatBillNumber(settings.billPrefix, sequence, now),
        customerName,
        customerPhone,
        status: "billed",
        ...totals.totals,
        taxRateBps: settings.taxRateBps,
        taxLabel: settings.taxLabel,
        receiptFooter: settings.receiptFooter,
        cafeName: cafe.name,
        cafeAddress: cafe.address,
        cafePhone: cafe.phone,
        notes: cleanText(input.notes, 300),
        createdBy: actor.id,
        clientRequestId: input.clientRequestId,
        whatsappOpenedAt: null,
        createdAt: stamp,
        items: priced.map((line) => ({
          id: crypto.randomUUID(),
          menuItemId: line.menuItemId,
          name: line.name,
          pricePaise: line.pricePaise,
          quantity: line.quantity,
          lineTotalPaise: line.pricePaise * line.quantity,
        })),
      };
      db.orders.push(order);
      commit();
      return { ok: true, data: clone(order) };
    },

    markWhatsappOpened(actor: Actor, orderId: string): Result<OrderDetail> {
      if (!canBill(actor.role)) return { ok: false, error: "You cannot update this bill." };
      const order = db.orders.find((entry) => entry.id === orderId && entry.cafeId === actor.cafeId);
      if (!order) return { ok: false, error: "Bill not found." };
      if (order.status === "cancelled") {
        return { ok: false, error: "Cancelled bills cannot open WhatsApp." };
      }
      if (!order.customerPhone) {
        return { ok: false, error: "Add a customer phone number before opening WhatsApp." };
      }
      if (!order.whatsappOpenedAt) order.whatsappOpenedAt = nowIso();
      order.status = "whatsapp_opened";
      commit();
      return { ok: true, data: clone(order) };
    },

    cancelOrder(actor: Actor, orderId: string): Result<OrderDetail> {
      if (!canBill(actor.role)) return { ok: false, error: "You cannot update this bill." };
      const order = db.orders.find((entry) => entry.id === orderId && entry.cafeId === actor.cafeId);
      if (!order) return { ok: false, error: "Bill not found." };
      order.status = "cancelled";
      commit();
      return { ok: true, data: clone(order) };
    },

    createInvite(actor: Actor): Result<{ code: string }> {
      if (!canManageSettings(actor.role)) {
        return { ok: false, error: "Only the owner can invite staff." };
      }
      let code = "";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const bytes = crypto.getRandomValues(new Uint8Array(8));
        code = Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
        if (!db.invites.some((entry) => entry.code === code)) break;
      }
      const stamp = nowIso();
      db.invites.push({
        id: crypto.randomUUID(),
        cafeId: actor.cafeId,
        code,
        role: "staff",
        createdBy: actor.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        usedBy: null,
        usedAt: null,
        createdAt: stamp,
      });
      commit();
      return { ok: true, data: { code } };
    },

    listInvites(actor: Actor) {
      if (!canManageSettings(actor.role)) return [];
      return db.invites
        .filter((entry) => entry.cafeId === actor.cafeId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((entry) => clone(entry));
    },

    dashboard(cafeId: string, now = new Date()): DashboardStats {
      const orders = db.orders
        .filter((order) => order.cafeId === cafeId)
        .map((order) => summary(order));
      return summarizeOrders(orders, now);
    },

    requireActor,
  };
}

export type MemoryStore = ReturnType<typeof createMemoryStore>;
