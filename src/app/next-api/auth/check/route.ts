import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/auth/check?type=email&value=xxx
// GET /api/auth/check?type=phone&value=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const value = searchParams.get('value')?.trim();

  if (!type || !value || !['email', 'phone'].includes(type)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('profiles')
    .select('id')
    .eq(type, value)
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}
