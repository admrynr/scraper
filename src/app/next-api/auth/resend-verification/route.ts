import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// POST /next-api/auth/resend-verification
// Resends the signup verification email via Brevo SMTP
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });
    }

    const siteUrl = request.nextUrl.origin;

    const anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await anonClient.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/verify-success`,
      },
    });

    if (error) {
      console.error('[resend-verification] Supabase error:', error.message);
      // Supabase rate limit is usually 60s
      const msg = error.message.includes('rate_limit') ? 'Tunggu beberapa saat sebelum mengirim ulang email.' : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Email verifikasi telah dikirim ulang.' });
  } catch (err: any) {
    console.error('[resend-verification] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
