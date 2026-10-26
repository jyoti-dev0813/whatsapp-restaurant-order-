import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { seedDemoDatabase } from "@/lib/demo/seed";
import { createMemoryStore, type MemoryStore } from "@/lib/demo/store";
import type { DemoDatabase } from "@/lib/demo/types";

const globalStore = globalThis as typeof globalThis & {
  __cafebillStore?: MemoryStore;
};

function databasePath() {
  return path.join(process.cwd(), "data", "demo-db.json");
}

function persist(db: DemoDatabase) {
  const file = databasePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(db), "utf8");
}

export function getDemoStore(): MemoryStore {
  if (!globalStore.__cafebillStore) {
    const file = databasePath();
    const db = existsSync(file)
      ? (JSON.parse(readFileSync(file, "utf8")) as DemoDatabase)
      : seedDemoDatabase();
    if (!existsSync(file)) persist(db);
    globalStore.__cafebillStore = createMemoryStore(db, { onChange: persist });
  }
  return globalStore.__cafebillStore;
}
