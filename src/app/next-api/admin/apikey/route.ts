import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Guard helper
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin'].includes(profile.role)) return null;
  return { user, profile, adminClient };
}

// GET — list all API keys + active status
export async function GET() {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: keys, error } = await ctx.adminClient
    .from('serp_api_keys')
    .select('id, label, is_active, quota_exhausted, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check quota from SerpAPI for the active key
  let quotaInfo = null;
  const activeKey = await ctx.adminClient
    .from('serp_api_keys')
    .select('api_key')
    .eq('is_active', true)
    .single();

  if (activeKey.data?.api_key) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://serpapi.com/account?api_key=${activeKey.data.api_key}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const acc = await res.json();
        quotaInfo = {
          searches_per_month: acc.plan_searches_left,
          this_month_usage: acc.this_month_usage,
          plan_name: acc.plan_name,
          total_searches_left: acc.total_searches_left,
        };
        // Flag quota exhausted if very low
        if (acc.total_searches_left !== undefined && acc.total_searches_left <= 0) {
          await ctx.adminClient
            .from('serp_api_keys')
            .update({ quota_exhausted: true })
            .eq('is_active', true);
        }
      }
    } catch (_) { /* timeout or network — skip */ }
  }

  return NextResponse.json({ keys, quotaInfo });
}

// POST — add new API key
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { api_key, label, set_active } = await request.json();
  if (!api_key) return NextResponse.json({ error: 'api_key required' }, { status: 400 });

  // If setting active, deactivate others first
  if (set_active) {
    await ctx.adminClient.from('serp_api_keys').update({ is_active: false }).neq('id', 0);
  }

  const { data, error } = await ctx.adminClient
    .from('serp_api_keys')
    .insert({
      api_key,
      label: label || 'Key Baru',
      is_active: set_active ?? false,
      quota_exhausted: false,
      created_by: ctx.user.id,
    })
    .select('id, label, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, key: data });
}

// PATCH — set a key as active
export async function PATCH(request: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Deactivate all
  await ctx.adminClient.from('serp_api_keys').update({ is_active: false }).neq('id', 0);
  // Activate target + reset quota_exhausted
  const { error } = await ctx.adminClient
    .from('serp_api_keys')
    .update({ is_active: true, quota_exhausted: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — remove a key
export async function DELETE(request: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await ctx.adminClient.from('serp_api_keys').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
