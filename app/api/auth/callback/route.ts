import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ALLOWED_DOMAIN = 'ogr.iuc.edu.tr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    // No code — redirect to sign-in with error
    return NextResponse.redirect(new URL('/tr/auth/signin?error=missing_code', request.url));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('OAuth code exchange error:', error);
    return NextResponse.redirect(
      new URL('/tr/auth/signin?error=auth_failed', request.url)
    );
  }

  // Validate that the user's email belongs to the allowed domain
  const userEmail = data.session?.user?.email;
  if (userEmail) {
    const domain = userEmail.toLowerCase().split('@')[1];
    if (domain !== ALLOWED_DOMAIN) {
      // Sign out the user — they used a non-university Google account
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL('/tr/auth/signin?error=invalid_domain', request.url)
      );
    }
  }

  // Success — redirect to the intended destination
  return NextResponse.redirect(new URL(next, request.url));
}
