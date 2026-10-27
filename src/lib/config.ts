export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key || key.length < 20) return false;
  if (url.includes("your-project") || key.includes("your-anon")) return false;

  try {
    const parsed = new URL(url);
    const hosted =
      parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
    const local =
      (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
      (parsed.port === "54321" || parsed.port === "");
    return hosted || local;
  } catch {
    return false;
  }
}

export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return configured || "http://localhost:3000";
}

export function appMode(): "demo" | "supabase" {
  return isSupabaseConfigured() ? "supabase" : "demo";
}

export function isHostedDemo(): boolean {
  return appMode() === "demo" && process.env.VERCEL === "1";
}
