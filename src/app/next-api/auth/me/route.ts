import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// GET /next-api/auth/me
// Returns current user's profile via admin client (bypasses RLS).
// Auto-creates profile if DB trigger failed to create it.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Try to fetch existing profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, full_name, role, is_approved, phone, daily_credits, purchased_credits, last_reset_date')
      .eq('id', user.id)
      .single();

    // If no profile exists (trigger may have failed), auto-create one now
    if (!profile) {
      console.warn('[me] Profile not found for user', user.id, '— auto-creating...');

      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const isSuperAdmin = superAdminEmails.includes(user.email?.toLowerCase() ?? '');
      const meta = user.user_metadata ?? {};

      const { data: created, error: createError } = await adminClient
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email!,
            full_name: meta.full_name ?? user.email,
            phone: meta.phone ?? null,
            role: isSuperAdmin ? 'super_admin' : (meta.role ?? 'user'),
            is_approved: isSuperAdmin ? true : (meta.is_approved ?? false),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (createError) {
        console.error('[me] Failed to auto-create profile:', createError);
        return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 });
      }

      console.log('[me] Auto-created profile:', created);
      return NextResponse.json(created);
    }

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error('[me] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
