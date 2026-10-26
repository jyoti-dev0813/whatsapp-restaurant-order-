import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEMO_IDS } from "@/lib/demo/credentials";
import { seedDemoDatabase } from "@/lib/demo/seed";
import { createMemoryStore } from "@/lib/demo/store";

const hearthOwner = {
  id: DEMO_IDS.owner,
  email: "owner@demo.local",
  fullName: "Hearth Owner",
  cafeId: DEMO_IDS.hearth,
  role: "owner" as const,
};

const hearthStaff = {
  id: DEMO_IDS.staff,
  email: "staff@demo.local",
  fullName: "Hearth Staff",
  cafeId: DEMO_IDS.hearth,
  role: "staff" as const,
};

const riverbendOwner = {
  id: DEMO_IDS.other,
  email: "other@demo.local",
  fullName: "Riverbend Owner",
  cafeId: DEMO_IDS.riverbend,
  role: "owner" as const,
};

function store() {
  return createMemoryStore(seedDemoDatabase());
}

describe("demo tenant store", () => {
  it("hides another cafe order and menu item", () => {
    const db = store();
    const placed = db.placeOrder(hearthOwner, {
      clientRequestId: "33333333-3333-4333-8333-333333333333",
      customerName: "Asha",
      customerPhone: "9876543210",
      discountPaise: 0,
      notes: "",
      items: [{ menuItemId: "11111111-1111-4111-8111-111111111301", quantity: 2 }],
    });
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(db.getOrder(DEMO_IDS.riverbend, placed.data.id)).toBeNull();
    expect(db.listMenu(DEMO_IDS.riverbend).some((item) => item.name === "Filter Coffee")).toBe(
      false,
    );
    expect(db.listOrders(DEMO_IDS.riverbend)).toHaveLength(0);
  });

  it("snapshots the menu price and ignores a later price change", () => {
    const db = store();
    const placed = db.placeOrder(hearthOwner, {
      clientRequestId: "33333333-3333-4333-8333-333333333334",
      customerName: "Asha",
      customerPhone: "",
      discountPaise: 0,
      notes: "",
      items: [{ menuItemId: "11111111-1111-4111-8111-111111111301", quantity: 1 }],
    });
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.data.items[0]?.pricePaise).toBe(8000);
    expect(placed.data.totalPaise).toBe(8400);
    const updated = db.updateMenuItem(hearthOwner, "11111111-1111-4111-8111-111111111301", {
      categoryId: "11111111-1111-4111-8111-111111111201",
      name: "Filter Coffee",
      description: "New price",
      pricePaise: 9000,
      isAvailable: true,
    });
    expect(updated.ok).toBe(true);
    expect(db.getOrder(DEMO_IDS.hearth, placed.data.id)?.items[0]?.pricePaise).toBe(8000);
  });

  it("reuses the same bill when the request id is repeated", () => {
    const db = store();
    const input = {
      clientRequestId: "33333333-3333-4333-8333-333333333335",
      customerName: "Asha",
      customerPhone: "9876543210",
      discountPaise: 0,
      notes: "",
      items: [{ menuItemId: "11111111-1111-4111-8111-111111111302", quantity: 1 }],
    };
    const first = db.placeOrder(hearthStaff, input);
    const second = db.placeOrder(hearthStaff, {
      ...input,
      items: [{ menuItemId: "11111111-1111-4111-8111-111111111303", quantity: 4 }],
    });
    expect(first.ok && second.ok && first.data.id === second.data.id).toBe(true);
    expect(db.listOrders(DEMO_IDS.hearth)).toHaveLength(1);
  });

  it("blocks staff from editing the menu and blocks another cafe item", () => {
    const db = store();
    expect(
      db.createMenuItem(hearthStaff, {
        categoryId: null,
        name: "Secret",
        description: "",
        pricePaise: 100,
        isAvailable: true,
      }).ok,
    ).toBe(false);
    const foreign = db.placeOrder(riverbendOwner, {
      clientRequestId: "33333333-3333-4333-8333-333333333336",
      customerName: "Ravi",
      customerPhone: "",
      discountPaise: 0,
      notes: "",
      items: [{ menuItemId: "11111111-1111-4111-8111-111111111301", quantity: 1 }],
    });
    expect(foreign).toEqual({ ok: false, error: "That item is not on this cafe menu." });
  });

  it("does not count a cancelled bill as revenue", () => {
    const db = store();
    const placed = db.placeOrder(
      hearthOwner,
      {
        clientRequestId: "33333333-3333-4333-8333-333333333337",
        customerName: "Asha",
        customerPhone: "",
        discountPaise: 0,
        notes: "",
        items: [{ menuItemId: "11111111-1111-4111-8111-111111111302", quantity: 1 }],
      },
      new Date("2026-10-26T10:00:00.000Z"),
    );
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    db.cancelOrder(hearthOwner, placed.data.id);
    const stats = db.dashboard(DEMO_IDS.hearth, new Date("2026-10-26T12:00:00.000Z"));
    expect(stats.todayRevenuePaise).toBe(0);
    expect(stats.todayOrders).toBe(0);
    expect(stats.recent[0]?.status).toBe("cancelled");
  });
});

describe("supabase migration", () => {
  const sql = readFileSync(
    path.join(process.cwd(), "supabase", "migrations", "001_init.sql"),
    "utf8",
  );

  it("enables row level security and keeps bill math in the database", () => {
    for (const table of [
      "cafes",
      "profiles",
      "menu_categories",
      "menu_items",
      "customers",
      "orders",
      "order_items",
      "cafe_settings",
      "staff_invites",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
    expect(sql).toContain("((v_taxable * v_tax_bps) + 5000) / 10000");
    expect(sql).toContain("revoke insert, update, delete on public.orders from authenticated");
    expect(sql).not.toContain("service_role");
  });
});
