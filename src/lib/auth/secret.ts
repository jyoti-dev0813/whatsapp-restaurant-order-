const DEV_ONLY_SECRET = "dev-only-cafebill-session-secret-change-me";

export function getDemoSessionSecret(): string | null {
  const configured = process.env.DEMO_SESSION_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "production") return DEV_ONLY_SECRET;
  return null;
}

export const DEMO_SECRET_ERROR =
  "Demo mode in production needs DEMO_SESSION_SECRET set to at least 32 characters.";
