import { NextResponse } from "next/server";

import { appMode } from "@/lib/config";

export function GET() {
  const mode = appMode();
  return NextResponse.json({
    ok: true,
    mode,
    persistence: mode === "supabase" ? "supabase" : "local-file",
  });
}
