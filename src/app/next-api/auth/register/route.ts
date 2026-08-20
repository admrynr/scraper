import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // Create auth user via admin client (auto-confirms email, no verification email needed)
    const { data: { user }, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone: phone || null,
        role: isSuperAdmin ? 'super_admin' : 'user',
        is_approved: isSuperAdmin,
      },
    });

    if (createError) {
      if (createError.message.includes('already registered') || createError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
      }
      throw createError;
    }

    if (!user) throw new Error('User creation failed');

    // Upsert profile — handles the race condition where the DB trigger may not
    // have created the profile row yet when we try to update it.
    // We wait briefly to give the trigger a chance to fire, then upsert so the
    // row is created-or-updated in one atomic operation.
    await new Promise((r) => setTimeout(r, 300));
    await adminClient
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name,
          phone: phone || null,
          role: isSuperAdmin ? 'super_admin' : 'user',
          is_approved: isSuperAdmin,
        },
        { onConflict: 'id' }
      );

    return NextResponse.json({
      success: true,
      isSuperAdmin,
      message: isSuperAdmin
        ? 'Akun super admin berhasil dibuat. Silakan login.'
        : 'Pendaftaran berhasil! Akun Anda menunggu persetujuan admin sebelum bisa digunakan.',
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
