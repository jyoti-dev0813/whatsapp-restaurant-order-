import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { COOKIE_NAME, openSession } from "@/lib/auth/session-crypto";
import { getDemoSessionSecret } from "@/lib/auth/secret";
import { isSupabaseConfigured } from "@/lib/config";
import { getDemoStore } from "@/lib/demo/db";
import type { Actor, SessionUser } from "@/lib/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser(): Promise<SessionUser | null> {
  await connection();
  if (!isSupabaseConfigured()) {
    const secret = getDemoSessionSecret();
    if (!secret) return null;
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await openSession(token, secret);
    if (!payload) return null;
    return getDemoStore().findUserById(payload.uid);
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const profile = await supabase
    .from("profiles")
    .select("cafe_id, full_name, role")
    .eq("id", data.user.id)
    .maybeSingle();
  const metadataName =
    typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : "";
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: profile.data?.full_name || metadataName,
    cafeId: profile.data?.cafe_id ?? null,
    role: profile.data?.role ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireActor(): Promise<Actor> {
  const user = await requireUser();
  if (!user.cafeId || !user.role) redirect("/onboarding");
  return { ...user, cafeId: user.cafeId, role: user.role };
}
