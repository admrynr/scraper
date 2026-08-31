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
  const timeoutId = setTimeout(() => controller.abort(), 7500);
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

// Credit tiers: 1 SerpAPI fetch (max 100 rows) = 1 credit
// Free user: tidak pakai credit, pakai scrape_count_today (max 5/hari), max 20 rows
const FREE_DAILY_SCRAPE_LIMIT = 5;
const FREE_MAX_ROWS = 20;
const ROWS_PER_CREDIT = 100; // 1 credit per 100 rows fetched

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // 2. Get user profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_approved, role, is_activated, purchased_credits, scrape_count_today, scrape_last_date')
    .eq('id', user.id)
    .single();

  if (!profile?.is_approved && !user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'Akun Anda belum disetujui admin dan email belum diverifikasi.' },
      { status: 403 }
    );
  }

  const isSuperAdmin = profile?.role === 'super_admin';
  const isActivated = profile?.is_activated === true;
  const today = new Date().toISOString().split('T')[0];

  // 3. Parse request body — get maxRows from frontend
  const body = await request.json();
  const { keyword, city, district = '', village = '', province = '', maxRows: requestedMaxRows = 20 } = body;

  if (!keyword || !city) {
    return NextResponse.json({ error: 'Keyword dan kota wajib diisi.' }, { status: 400 });
  }

  // 4. Enforce free user restrictions
  let effectiveMaxRows = requestedMaxRows;

  if (!isSuperAdmin) {
    if (!isActivated) {
      // Free user: max 20 rows, max 5 scrapes/day
      effectiveMaxRows = FREE_MAX_ROWS;

      // Reset daily count if new day
      let scrapeCountToday = profile?.scrape_count_today ?? 0;
      if (profile?.scrape_last_date !== today) {
        scrapeCountToday = 0;
        await adminClient.from('profiles')
          .update({ scrape_count_today: 0, scrape_last_date: today })
          .eq('id', user.id);
      }

      if (scrapeCountToday >= FREE_DAILY_SCRAPE_LIMIT) {
        return NextResponse.json(
          {
            error: `Batas scraping gratis hari ini sudah tercapai (${FREE_DAILY_SCRAPE_LIMIT}x/hari). Aktivasi akun untuk scraping tanpa batas.`,
            code: 'FREE_LIMIT_REACHED',
          },
          { status: 402 }
        );
      }

      // Increment free scrape count
      await adminClient.from('profiles')
        .update({ scrape_count_today: scrapeCountToday + 1, scrape_last_date: today })
        .eq('id', user.id);

    } else {
      // Activated user: check if they have enough credits
      // Credits needed = ceil(maxRows / ROWS_PER_CREDIT)
      const creditsNeeded = Math.ceil(effectiveMaxRows / ROWS_PER_CREDIT);
      const purchasedCredits = profile?.purchased_credits ?? 0;

      if (purchasedCredits < creditsNeeded) {
        return NextResponse.json(
          {
            error: `Kredit tidak cukup. Dibutuhkan ${creditsNeeded} credit untuk ${effectiveMaxRows} rows. Saldo Anda: ${purchasedCredits} credit.`,
            code: 'INSUFFICIENT_CREDITS',
          },
          { status: 402 }
        );
      }

      // Deduct credits upfront
      await adminClient.from('profiles')
        .update({ purchased_credits: purchasedCredits - creditsNeeded })
        .eq('id', user.id);
    }
  }

  // 5. Get active API key from DB
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

  // 6. Build location string
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

  // Each SerpAPI page returns up to 20 results, max 100 per "start" range
  // We paginate until we reach effectiveMaxRows
  const maxPages = Math.ceil(effectiveMaxRows / 20); // SerpAPI returns ~20 per page

  for (const kw of keywordsList) {
    if (partialReturn || data.length >= effectiveMaxRows) break;
    const searchQuery = `${kw} di ${locationStr}`;
    let start = 0;
    let page = 0;

    while (page < maxPages && data.length < effectiveMaxRows) {
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
          break;
        }
        const msg = err.message || '';
        if (
          msg.includes('out of searches') ||
          msg.includes('credit') ||
          msg.includes('quota') ||
          msg.includes('limit reached')
        ) {
          quotaExhausted = true;
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
        if (data.length >= effectiveMaxRows) break;
        // Deduplicate by place_id or name+address combo
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
  const headers: Record<string, string> = {};
  if (partialReturn) headers['X-Partial-Results'] = 'true';
  if (quotaExhausted) headers['X-Quota-Exhausted'] = 'true';
  headers['X-Is-Free-User'] = (!isSuperAdmin && !isActivated).toString();
  headers['X-Rows-Fetched'] = String(data.length);

  return NextResponse.json(data, { headers });
}
