import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek Premium Status
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'super_admin' && !profile?.is_activated) {
    return NextResponse.json({ error: 'Premium feature only' }, { status: 403 });
  }

  // Fetch lists
  const { data: lists, error } = await supabase
    .from('prospect_lists')
    .select('*, saved_prospects(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedLists = lists.map(l => ({
    ...l,
    prospect_count: l.saved_prospects?.[0]?.count || 0,
    saved_prospects: undefined
  }));

  return NextResponse.json(formattedLists);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek Premium Status
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'super_admin' && !profile?.is_activated) {
    return NextResponse.json({ error: 'Premium feature only' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Cek batasan max 10 list
  const { count, error: countError } = await supabase
    .from('prospect_lists')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count || 0) >= 10) {
    return NextResponse.json({ error: 'Limit campaign/list tercapai (maksimal 10 campaign saat ini)' }, { status: 400 });
  }

  // Insert list
  const { data: newList, error } = await supabase
    .from('prospect_lists')
    .insert([{ user_id: user.id, name, description }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...newList, prospect_count: 0 });
}
