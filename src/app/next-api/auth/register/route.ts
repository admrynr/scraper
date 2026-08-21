import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, dan nama wajib diisi.' }, { status: 400 });
    }

    // Validate phone format (Indonesian numbers)
    if (phone) {
      const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return NextResponse.json({ error: 'Format nomor telepon tidak valid.' }, { status: 400 });
      }
    }

    const adminClient = createAdminClient();

    // Check if phone already exists
    if (phone) {
      const { data: existingPhone } = await adminClient
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single();
      if (existingPhone) {
        return NextResponse.json({ error: 'Nomor telepon sudah terdaftar.' }, { status: 409 });
      }
    }

    // Determine role (check against SUPER_ADMIN_EMAILS env var)
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isSuperAdmin = superAdminEmails.includes(email.toLowerCase());

    const siteUrl = request.nextUrl.origin;

    if (isSuperAdmin) {
      // Super admin: skip email verification, auto-confirm and approve
      const { data: { user }, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone: phone || null,
          role: 'super_admin',
          is_approved: true,
        },
      });

      if (createError) {
        if (createError.message.includes('already registered') || createError.message.includes('already been registered')) {
          return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
        }
        throw createError;
      }
      if (!user) throw new Error('User creation failed');

      await new Promise((r) => setTimeout(r, 300));
      await adminClient.from('profiles').upsert(
        { id: user.id, full_name, phone: phone || null, role: 'super_admin', is_approved: true },
        { onConflict: 'id' }
      );

      return NextResponse.json({
        success: true,
        isSuperAdmin: true,
        requiresVerification: false,
        message: 'Akun super admin berhasil dibuat. Silakan login.',
      });
    }

    // Regular user: use signUp (triggers verification email via Brevo SMTP)
    const anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/verify-success`,
        data: {
          full_name,
          phone: phone || null,
          role: 'user',
          is_approved: false,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
      }
      throw signUpError;
    }

    const newUser = signUpData.user;
    if (!newUser) throw new Error('User creation failed');

    // Create profile row immediately (trigger may not fire fast enough)
    await new Promise((r) => setTimeout(r, 300));
    await adminClient.from('profiles').upsert(
      {
        id: newUser.id,
        email: newUser.email!,
        full_name,
        phone: phone || null,
        role: 'user',
        is_approved: false,
      },
      { onConflict: 'id' }
    );

    return NextResponse.json({
      success: true,
      isSuperAdmin: false,
      requiresVerification: true,
      message: 'Pendaftaran berhasil! Silakan cek email Anda untuk memverifikasi akun.',
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
