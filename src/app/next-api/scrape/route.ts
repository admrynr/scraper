import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 10; // Vercel Hobby cap

interface PlaceResult {
  keyword_used: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  province: string;
  city: string;
  district: string;
  village: string;
}

async function fetchSerpPage(url: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500); // 7.5s per request
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SerpAPI error (${response.status}): ${text}`);
    }
    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // 2. Check user is approved
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_approved, role')
    .eq('id', user.id)
    .single();

  if (!profile?.is_approved) {
    return NextResponse.json(
      { error: 'Akun Anda belum disetujui admin. Silakan tunggu persetujuan.' },
      { status: 403 }
    );
  }

  // 3. Get active API key from DB
  const { data: activeKey } = await adminClient
    .from('serp_api_keys')
    .select('id, api_key, quota_exhausted')
    .eq('is_active', true)
    .single();

  if (!activeKey) {
    return NextResponse.json(
      { error: 'Belum ada API key aktif. Hubungi admin untuk mengatur API key.' },
      { status: 503 }
    );
  }

  if (activeKey.quota_exhausted) {
    return NextResponse.json(
      { error: 'Kuota SerpAPI habis. Admin sedang menyiapkan API key baru.' },
      { status: 503 }
    );
  }

  // 4. Parse request body
  const body = await request.json();
  const { keyword, city, district = '', village = '', province = '' } = body;

  if (!keyword || !city) {
    return NextResponse.json({ error: 'Keyword dan kota wajib diisi.' }, { status: 400 });
  }

  const locationParts: string[] = [];
  if (village) locationParts.push(village);
  if (district) locationParts.push(district);
  locationParts.push(city);
  if (province) locationParts.push(province);
  const locationStr = locationParts.join(' ');

  const keywordsList = keyword.split(',').map((k: string) => k.trim()).filter(Boolean);
  const data: PlaceResult[] = [];
  const seenPlaces = new Set<string>();
  let quotaExhausted = false;
  let partialReturn = false;
  const MAX_PAGES = 2; // Cap at 2 pages per keyword (40 results) to stay within 10s

  for (const kw of keywordsList) {
    if (partialReturn) break;
    const searchQuery = `${kw} di ${locationStr}`;
    let start = 0;
    let page = 0;

    while (page < MAX_PAGES) {
      const url = new URL('https://serpapi.com/search.json');
      url.searchParams.set('engine', 'google_maps');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('type', 'search');
      url.searchParams.set('api_key', activeKey.api_key);
      url.searchParams.set('start', String(start));

      let results: any;
      try {
        results = await fetchSerpPage(url.toString());
      } catch (err: any) {
        if (err.message === 'TIMEOUT') {
          partialReturn = true;
          break; // Return what we have so far
        }
        // Check for quota exhaustion
        const msg = err.message || '';
        if (
          msg.includes('out of searches') ||
          msg.includes('credit') ||
          msg.includes('quota') ||
          msg.includes('limit reached')
        ) {
          quotaExhausted = true;
          // Flag in DB for admin notification
          await adminClient
            .from('serp_api_keys')
            .update({ quota_exhausted: true })
            .eq('id', activeKey.id);
        }
        break;
      }

      // Check for quota error in response body
      if (results?.error) {
        const errMsg = String(results.error).toLowerCase();
        if (
          errMsg.includes('out of searches') ||
          errMsg.includes('credit') ||
          errMsg.includes('quota') ||
          errMsg.includes('limit')
        ) {
          quotaExhausted = true;
          await adminClient
            .from('serp_api_keys')
            .update({ quota_exhausted: true })
            .eq('id', activeKey.id);
        }
        break;
      }

      const places = results.local_results || [];
      if (places.length === 0) break;

      for (const place of places) {
        const uniqueId = place.place_id || `${place.title}_${place.address}`;
        if (seenPlaces.has(uniqueId)) continue;
        seenPlaces.add(uniqueId);
        data.push({
          keyword_used: kw,
          name: place.title || null,
          address: place.address || null,
          phone: place.phone || null,
          website: place.website || null,
          rating: place.rating || null,
          reviews: place.reviews || null,
          province,
          city,
          district,
          village,
        });
      }

      if (!results.serpapi_pagination?.next) break;
      start += 20;
      page++;
    }
  }

  // Return results with optional warnings
  const response: any = data;
  const headers: Record<string, string> = {};
  if (partialReturn) headers['X-Partial-Results'] = 'true';
  if (quotaExhausted) headers['X-Quota-Exhausted'] = 'true';

  return NextResponse.json(response, { headers });
}
