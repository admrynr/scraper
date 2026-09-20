import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function getDfsAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const countryIso = searchParams.get('country');

  if (!countryIso) {
    return NextResponse.json({ error: 'Missing country parameter' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // 1. Cek di cache
  const { data: cachedRegions, error: cacheError } = await adminClient
    .from('supported_regions_cities')
    .select('location_code, location_name, parent_location_name')
    .eq('country_iso_code', countryIso)
    .order('location_name', { ascending: true });

  if (!cacheError && cachedRegions && cachedRegions.length > 0) {
    return NextResponse.json(cachedRegions);
  }

  // 2. Fetch on demand jika tidak ada di cache
  try {
    const res = await fetch(`https://api.dataforseo.com/v3/business_data/google/locations/${countryIso}`, {
      method: 'GET',
      headers: {
        Authorization: getDfsAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error(`DataForSEO error: ${res.statusText}`);
    }

    const data = await res.json();
    const tasks = data.tasks || [];
    if (tasks.length === 0 || !tasks[0].result) {
      return NextResponse.json([]);
    }

    const results = tasks[0].result;
    
    // Filter hanya region / city
    const regions = results.filter((loc: any) => 
      ['City', 'Region', 'Municipality'].includes(loc.location_type)
    );

    const insertData = regions.map((loc: any) => ({
      country_iso_code: countryIso,
      location_code: loc.location_code,
      location_name: loc.location_name,
      parent_location_name: loc.parent_location_name || null,
    }));

    if (insertData.length > 0) {
      // BATCH INSERT
      const BATCH_SIZE = 500;
      for (let i = 0; i < insertData.length; i += BATCH_SIZE) {
        const batch = insertData.slice(i, i + BATCH_SIZE);
        await adminClient.from('supported_regions_cities').upsert(batch, { onConflict: 'country_iso_code, location_code' }).select();
      }
    }

    // Sort manual sebelum dikembalikan agar urut abjad
    insertData.sort((a: any, b: any) => a.location_name.localeCompare(b.location_name));

    return NextResponse.json(insertData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
