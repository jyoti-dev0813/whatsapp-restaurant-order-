import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_NAME, openSession } from "@/lib/auth/session-crypto";
import { getDemoSessionSecret } from "@/lib/auth/secret";
import { isSupabaseConfigured } from "@/lib/config";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/api/health"]);

function isPublic(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

async function supabaseProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) request.cookies.set(cookie.name, cookie.value);
        response = NextResponse.next({ request });
        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!data.user && !isPublic(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (pathname !== "/") redirectUrl.searchParams.set("next", pathname);
    return copyCookies(response, NextResponse.redirect(redirectUrl));
  }

  if (data.user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return copyCookies(response, NextResponse.redirect(redirectUrl));
  }

  return response;
}

export async function proxy(request: NextRequest) {
  if (isSupabaseConfigured()) return supabaseProxy(request);

  const { pathname } = request.nextUrl;
  const secret = getDemoSessionSecret();
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = secret && token ? await openSession(token, secret) : null;

  if (!session && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
