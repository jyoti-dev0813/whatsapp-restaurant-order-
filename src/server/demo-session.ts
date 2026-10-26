import "server-only";

import { cookies } from "next/headers";

import { COOKIE_NAME, sealSession } from "@/lib/auth/session-crypto";
import { DEMO_SECRET_ERROR, getDemoSessionSecret } from "@/lib/auth/secret";

const WEEK_SECONDS = 60 * 60 * 24 * 7;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_SECONDS,
  };
}

export async function setDemoCookie(userId: string) {
  const secret = getDemoSessionSecret();
  if (!secret) return { ok: false as const, error: DEMO_SECRET_ERROR };
  const token = await sealSession(
    { uid: userId, exp: Math.floor(Date.now() / 1000) + WEEK_SECONDS },
    secret,
  );
  (await cookies()).set(COOKIE_NAME, token, sessionCookieOptions());
  return { ok: true as const };
}

export async function clearDemoCookie() {
  (await cookies()).set(COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
}
