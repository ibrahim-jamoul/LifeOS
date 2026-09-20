import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, getSupabaseEnv } from "@/lib/env";

const privatePrefix = "/app";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    if (request.nextUrl.pathname.startsWith(privatePrefix)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("setup", "1");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(cacheHeaders)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith(privatePrefix) && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const redirectResponse = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
    for (const headerName of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(headerName);
      if (value) redirectResponse.headers.set(headerName, value);
    }
    return redirectResponse;
  }

  if (isAuthenticated && ["/login", "/signup"].includes(pathname)) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/app/dashboard";
    appUrl.search = "";
    const redirectResponse = NextResponse.redirect(appUrl);
    for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
    for (const headerName of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(headerName);
      if (value) redirectResponse.headers.set(headerName, value);
    }
    return redirectResponse;
  }

  return response;
}
