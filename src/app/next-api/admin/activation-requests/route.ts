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

  const { data: requests, error } = await adminClient
    .from('activation_requests')
    .select(`
      id, type, amount, credits, status, midtrans_payment_type, created_at,
      user:profiles(email, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(requests);
}
