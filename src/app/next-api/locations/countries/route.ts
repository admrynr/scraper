import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function getDfsAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_activated')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = isSuperAdmin || profile?.role === 'admin';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Coming Soon for non-admins' }, { status: 403 });
  }

  const adminClient = createAdminClient();

  // Try to fetch from DB
  const { data, error } = await supabase
    .from('supported_countries')
    .select('country_iso_code, location_name, business_count, is_recommended, flag_emoji')
    .gte('business_count', 100)
    .order('location_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Jika masih kosong, auto-fetch dari DataForSEO
  if (data && data.length === 0) {
    try {
      const res = await fetch('https://api.dataforseo.com/v3/business_data/business_listings/locations', {
        method: 'GET',
        headers: { Authorization: getDfsAuthHeader() },
      });

      if (!res.ok) {
        throw new Error(`DataForSEO error: ${res.statusText}`);
      }

      const dfsData = await res.json();
      const results = dfsData.tasks?.[0]?.result || [];
      
      const countries = results.filter((r: any) => r.location_type === 'Country');
      const insertData = countries.map((c: any) => ({
        country_iso_code: c.country_iso_code,
        location_name: c.location_name,
        business_count: c.business_count || 0,
      }));

      if (insertData.length > 0) {
        // Upsert ke database
        await adminClient.from('supported_countries').upsert(insertData, { onConflict: 'country_iso_code' });
        
        // Fetch ulang dari database (agar order ter-apply)
        const { data: newData } = await supabase
          .from('supported_countries')
          .select('country_iso_code, location_name, business_count, is_recommended, flag_emoji')
          .gte('business_count', 100)
          .order('location_name', { ascending: true });
        
        return NextResponse.json(newData || insertData);
      }
    } catch (e: any) {
      console.error('Auto-fetch countries error:', e);
    }
  }

  return NextResponse.json(data);
}
