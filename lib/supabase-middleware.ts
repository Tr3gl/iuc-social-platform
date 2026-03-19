import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase server client bound to the request/response cookie jar.
 * Refreshes the auth session on every request so tokens never expire silently.
 *
 * Returns { supabase, response } — the response object carries any Set-Cookie
 * headers that the Supabase SDK needs to persist.
 */
export function createSupabaseMiddlewareClient(request: NextRequest) {
  // Start with a plain NextResponse that forwards the request headers
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Set on the request so downstream handlers see them
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // 2. Recreate the response so the browser receives Set-Cookie headers
          response = NextResponse.next({
            request: { headers: request.headers },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}
