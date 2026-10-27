import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { seedDemoDatabase } from "@/lib/demo/seed";
import { createMemoryStore, type MemoryStore } from "@/lib/demo/store";
import type { DemoDatabase } from "@/lib/demo/types";

const globalStore = globalThis as typeof globalThis & {
  __cafebillStore?: MemoryStore;
};

function databasePath() {
  // Vercel functions can only write under the temporary directory, and that
  // directory is wiped. Local development keeps the gitignored data file.
  const root = process.env.VERCEL ? path.join(os.tmpdir(), "cafebill") : path.join(process.cwd(), "data");
  return path.join(root, "demo-db.json");
}

function persist(db: DemoDatabase) {
  try {
    const file = databasePath();
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(db), "utf8");
  } catch {
    // A read-only host must not fail the bill. The in-memory store still serves this instance.
  }
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
