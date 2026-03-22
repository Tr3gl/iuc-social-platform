import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createSupabaseMiddlewareClient } from '@/lib/supabase-middleware';

// ── next-intl locale routing ────────────────────────────────────────────────
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'tr'],
  defaultLocale: 'tr',
  localePrefix: 'always',
});

// ── Routes that require an authenticated session ────────────────────────────
const PROTECTED_PATHS = ['/admin'];

function isProtectedPath(pathname: string): boolean {
  // Strip locale prefix (e.g. /tr/admin → /admin)
  const withoutLocale = pathname.replace(/^\/(en|tr)/, '');
  return PROTECTED_PATHS.some(
    (p) => withoutLocale === p || withoutLocale.startsWith(`${p}/`)
  );
}

// ── Main middleware ─────────────────────────────────────────────────────────
export default async function middleware(request: NextRequest) {
  // 1. Supabase — refresh the session (sets/updates cookies)
  const { supabase, response: supabaseResponse } =
    createSupabaseMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Protect private routes
  if (isProtectedPath(request.nextUrl.pathname)) {
    const locale = request.nextUrl.pathname.startsWith('/en') ? 'en' : 'tr';
    
    // Redirect to sign-in if not authenticated
    if (!user) {
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Redirect to home if user is not admin
    if (user.app_metadata?.role !== 'admin') {
      const homeUrl = new URL(`/${locale}`, request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // 3. Run next-intl middleware (locale detection, prefix management)
  const intlResponse = intlMiddleware(request);

  // 4. Merge Set-Cookie headers from Supabase into the intl response
  //    so the browser receives both locale cookies AND auth cookies.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

// ── Matcher — skip static assets, API routes, Next.js internals ─────────────
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
