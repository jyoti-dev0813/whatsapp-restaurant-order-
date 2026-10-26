import { defaultCafeSettings } from "@/lib/demo/defaults";
import { DEMO_ACCOUNTS, DEMO_IDS } from "@/lib/demo/credentials";
import { hashPassword } from "@/lib/demo/passwords";
import type { DemoDatabase, DemoUser } from "@/lib/demo/types";

const SEEDED_AT = "2026-10-26T08:00:00.000Z";

function user(
  id: string,
  email: string,
  fullName: string,
  password: string,
  cafeId: string,
  role: "owner" | "staff",
): DemoUser {
  const hashed = hashPassword(password);
  return {
    id,
    email,
    fullName,
    passwordSalt: hashed.salt,
    passwordHash: hashed.hash,
    cafeId,
    role,
    createdAt: SEEDED_AT,
  };
}

export function seedDemoDatabase(): DemoDatabase {
  const owner = DEMO_ACCOUNTS[0];
  const staff = DEMO_ACCOUNTS[1];
  const other = DEMO_ACCOUNTS[2];

  return {
    users: [
      user(DEMO_IDS.owner, owner.email, "Hearth Owner", owner.password, DEMO_IDS.hearth, "owner"),
      user(DEMO_IDS.staff, staff.email, "Hearth Staff", staff.password, DEMO_IDS.hearth, "staff"),
      user(DEMO_IDS.other, other.email, "Riverbend Owner", other.password, DEMO_IDS.riverbend, "owner"),
    ],
    cafes: [
      {
        id: DEMO_IDS.hearth,
        name: "Hearth & Co.",
        address: "12 Baker Street, Pune",
        phone: "02040001111",
        email: "hello@hearth.demo",
        createdAt: SEEDED_AT,
        updatedAt: SEEDED_AT,
      },
      {
        id: DEMO_IDS.riverbend,
        name: "Riverbend Cafe",
        address: "8 River Road, Pune",
        phone: "02040002222",
        email: "hello@riverbend.demo",
        createdAt: SEEDED_AT,
        updatedAt: SEEDED_AT,
      },
    ],
    settings: [
      defaultCafeSettings(DEMO_IDS.hearth, SEEDED_AT),
      defaultCafeSettings(DEMO_IDS.riverbend, SEEDED_AT),
    ],
    categories: [
      {
        id: "11111111-1111-4111-8111-111111111201",
        cafeId: DEMO_IDS.hearth,
        name: "Drinks",
        sortOrder: 1,
        createdAt: SEEDED_AT,
      },
      {
        id: "11111111-1111-4111-8111-111111111202",
        cafeId: DEMO_IDS.hearth,
        name: "Food",
        sortOrder: 2,
        createdAt: SEEDED_AT,
      },
      {
        id: "22222222-2222-4222-8222-222222222201",
        cafeId: DEMO_IDS.riverbend,
        name: "Specials",
        sortOrder: 1,
        createdAt: SEEDED_AT,
      },
    ],
    items: [
      {
        id: "11111111-1111-4111-8111-111111111301",
        cafeId: DEMO_IDS.hearth,
        categoryId: "11111111-1111-4111-8111-111111111201",
        name: "Filter Coffee",
        description: "South Indian filter coffee",
        pricePaise: 8000,
        isAvailable: true,
        createdAt: SEEDED_AT,
        updatedAt: SEEDED_AT,
      },
      {
        id: "11111111-1111-4111-8111-111111111302",
        cafeId: DEMO_IDS.hearth,
        categoryId: "11111111-1111-4111-8111-111111111201",
        name: "Masala Chai",
        description: "Ginger and cardamom",
        pricePaise: 4000,
        isAvailable: true,
        createdAt: SEEDED_AT,
        updatedAt: SEEDED_AT,
      },
      {
        id: "11111111-1111-4111-8111-111111111303",
        cafeId: DEMO_IDS.hearth,
        categoryId: "11111111-1111-4111-8111-111111111202",
        name: "Veg Grill Sandwich",
        description: "Mint chutney and cheese",
        pricePaise: 15000,
        isAvailable: true,
        createdAt: SEEDED_AT,
        updatedAt: SEEDED_AT,
      },
      {
        id: "22222222-2222-4222-8222-222222222301",
        cafeId: DEMO_IDS.riverbend,
        categoryId: "22222222-2222-4222-8222-222222222201",
        name: "Riverbend Special",
        description: "Only sold at Riverbend",
        pricePaise: 20000,
        isAvailable: true,
        createdAt: SEEDED_AT,
        updatedAt: SEEDED_AT,
      },
    ],
    customers: [],
    orders: [],
    invites: [],
  };
}
