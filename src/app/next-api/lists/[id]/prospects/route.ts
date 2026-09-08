import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query params for filtering
  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = supabase
    .from('saved_prospects')
    .select('*')
    .eq('list_id', id)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const { prospects } = body; // Array of prospects

  if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
    return NextResponse.json({ error: 'No prospects provided' }, { status: 400 });
  }

  const prospectsToInsert = prospects.map((p: any) => ({
    list_id: id,
    user_id: user.id,
    place_id: p.place_id,
    name: p.name || 'Unknown',
    category: p.category || null,
    address: p.address || null,
    phone: p.phone || null,
    website: p.website || null,
    rating: p.rating ? parseFloat(p.rating) : null,
    reviews: p.reviews ? parseInt(p.reviews, 10) : null,
    maps_url: p.maps_url || null,
    status: 'belum_dihubungi', // default
  }));

  // Upsert to ignore duplicates based on list_id and place_id
  const { error } = await supabase
    .from('saved_prospects')
    .upsert(prospectsToInsert, { onConflict: 'list_id,place_id', ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: prospectsToInsert.length });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { prospectIds } = body; // Array of IDs to delete

  if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
    return NextResponse.json({ error: 'No prospect IDs provided' }, { status: 400 });
  }

  const { error } = await supabase
    .from('saved_prospects')
    .delete()
    .eq('list_id', id)
    .eq('user_id', user.id)
    .in('id', prospectIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
