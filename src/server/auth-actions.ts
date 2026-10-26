"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/paths";
import { isSupabaseConfigured } from "@/lib/config";
import { cleanText } from "@/lib/text";
import {
  cafeSchema,
  fieldErrorsFrom,
  joinSchema,
  loginSchema,
  signupSchema,
  type ActionState,
} from "@/lib/validation/schemas";
import { clearDemoCookie, setDemoCookie } from "@/server/demo-session";
import { authenticateDemo, createCafeForUser, joinCafe, registerDemoUser } from "@/server/data";
import { getSessionUser, requireUser } from "@/server/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    nextPath: String(formData.get("nextPath") ?? ""),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  if (!isSupabaseConfigured()) {
    const result = await authenticateDemo(parsed.data.email, parsed.data.password);
    if (!result.ok) return { error: result.error };
    const cookie = await setDemoCookie(result.data.id);
    if (!cookie.ok) return { error: cookie.error };
    redirect(result.data.cafeId ? safeNextPath(parsed.data.nextPath) : "/onboarding");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return {
      error: "Email or password is incorrect, or the email address is not confirmed yet.",
    };
  }
  const user = await getSessionUser();
  redirect(user?.cafeId ? safeNextPath(parsed.data.nextPath) : "/onboarding");
}

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const fullName = cleanText(parsed.data.fullName, 80);

  if (!isSupabaseConfigured()) {
    const created = await registerDemoUser({ ...parsed.data, fullName });
    if (!created.ok) return { error: created.error };
    const cookie = await setDemoCookie(created.data.id);
    if (!cookie.ok) return { error: cookie.error };
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: "Could not create the account. Try a different email." };
  if (!data.session) {
    return {
      error:
        "Account created. Confirm the email from Supabase, then sign in. For local testing, turn off email confirmation in the free Supabase Auth settings.",
    };
  }
  redirect("/onboarding");
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    await clearDemoCookie();
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function createCafeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cafeSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const user = await requireUser();
  if (user.cafeId) redirect("/dashboard");
  const created = await createCafeForUser(user, {
    name: cleanText(parsed.data.name, 80),
    address: cleanText(parsed.data.address, 200),
    phone: cleanText(parsed.data.phone, 20),
    email: parsed.data.email,
  });
  if (!created.ok) return { error: created.error };
  redirect("/dashboard");
}

export async function joinCafeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = joinSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const user = await requireUser();
  if (user.cafeId) redirect("/dashboard");
  const joined = await joinCafe(user, parsed.data.code);
  if (!joined.ok) return { error: joined.error };
  redirect("/dashboard");
}
