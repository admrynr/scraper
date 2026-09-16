import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = createAdminClient();
  const { data: callerProfile } = await adminClient
    .from('profiles').select('role').eq('id', user.id).single();

  if (!callerProfile || !['super_admin', 'admin'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  // Ambil profile user
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, email, full_name, purchased_credits, is_activated, is_approved, role, created_at, scrape_count_today')
    .eq('id', userId)
    .single();

  // Ambil semua transaksi user
  const { data: transactions, error } = await adminClient
    .from('activation_requests')
    .select('id, type, amount, credits, status, midtrans_order_id, midtrans_payment_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile, transactions: transactions || [] });
}
