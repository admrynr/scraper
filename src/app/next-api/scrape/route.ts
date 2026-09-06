import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_DAILY_SCRAPE_LIMIT = 5;
const FREE_MAX_ROWS = 20;
/**
 * 1 app credit = 1 SerpAPI call = up to 20 Google Maps results.
 * Cache key: kombinasi query string + page_number (nomor call ke-berapa).
 */
const ROWS_PER_CREDIT = 20;
const CACHE_TTL_HOURS = 24;
const SERP_FETCH_TIMEOUT_MS = 9000;

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchSerpPage(url: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SERP_FETCH_TIMEOUT_MS);
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

function isQuotaError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('out of searches') ||
    lower.includes('credit') ||
    lower.includes('quota') ||
    lower.includes('limit reached')
  );
}

function parsePlaces(
  rawPlaces: any[],
  kw: string,
  province: string,
  city: string,
  district: string,
  village: string
): PlaceResult[] {
  return rawPlaces.map((place: any) => ({
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
  }));
}

/**
 * Ambil satu blok cache.
 * page_number di sini = nomor call ke-berapa (1, 2, 3, ...).
 * start = (page_number - 1) * 20
 */
async function getCacheBlock(
  adminClient: ReturnType<typeof createAdminClient>,
  cacheKey: string,
  pageNumber: number
): Promise<{ data: PlaceResult[]; is_end_of_results: boolean } | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await adminClient
    .from('search_cache')
    .select('data, is_end_of_results')
    .eq('keyword', cacheKey)
    .eq('page_number', pageNumber)
    .gt('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as { data: PlaceResult[]; is_end_of_results: boolean };
}

/**
 * Simpan satu blok ke cache. Hapus entri lama terlebih dahulu.
 * Harus di-await — serverless akan kill promise yang belum resolve saat response dikirim.
 */
async function saveCacheBlock(
  adminClient: ReturnType<typeof createAdminClient>,
  cacheKey: string,
  pageNumber: number,
  results: PlaceResult[],
  isEndOfResults: boolean
): Promise<void> {
  await adminClient
    .from('search_cache')
    .delete()
    .eq('keyword', cacheKey)
    .eq('page_number', pageNumber);

  await adminClient.from('search_cache').insert({
    keyword: cacheKey,
    page_number: pageNumber,
    data: results,
    is_end_of_results: isEndOfResults,
  });
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // 2. Profile
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

  // 3. Parse body
  const body = await request.json();
  const {
    keyword,
    city,
    district = '',
    village = '',
    province = '',
    maxRows: requestedMaxRows = 20,
  } = body;

  if (!keyword || !city) {
    return NextResponse.json({ error: 'Keyword dan kota wajib diisi.' }, { status: 400 });
  }

  let effectiveMaxRows: number = requestedMaxRows;

  // ─── 4. Free user: flow lama tanpa cache ──────────────────────────────────
  if (!isSuperAdmin && !isActivated) {
    effectiveMaxRows = FREE_MAX_ROWS;

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

    await adminClient.from('profiles')
      .update({ scrape_count_today: scrapeCountToday + 1, scrape_last_date: today })
      .eq('id', user.id);

    return await handleFreeUserScrape(
      adminClient, keyword, city, district, village, province, effectiveMaxRows
    );
  }

  // ─── 5. Activated / SuperAdmin: credit check ──────────────────────────────
  // 1 credit = 1 SerpAPI call = up to 20 data
  const targetPages = Math.ceil(effectiveMaxRows / ROWS_PER_CREDIT);

  if (!isSuperAdmin) {
    const purchasedCredits = profile?.purchased_credits ?? 0;
    if (purchasedCredits < targetPages) {
      return NextResponse.json(
        {
          error: `Kredit tidak cukup. Dibutuhkan ${targetPages} kredit untuk ${effectiveMaxRows} data. Saldo Anda: ${purchasedCredits} kredit.`,
          code: 'INSUFFICIENT_CREDITS',
        },
        { status: 402 }
      );
    }
  }

  // ─── 6. API key ────────────────────────────────────────────────────────────
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

  // ─── 7. Build query & cache key ───────────────────────────────────────────
  const locationParts: string[] = [];
  if (village) locationParts.push(village);
  if (district) locationParts.push(district);
  locationParts.push(city);
  if (province) locationParts.push(province);
  const locationStr = locationParts.join(' ');

  const keywordsList = keyword.split(',').map((k: string) => k.trim()).filter(Boolean);
  const searchQuery = `${keywordsList[0]} di ${locationStr}`;

  // Cache key = full query string lowercase (shared antar semua user)
  const cacheKey = searchQuery.toLowerCase();

  const allResults: PlaceResult[] = [];
  let pagesProcessed = 0;
  let quotaExhausted = false;
  let partialReturn = false;

  // ─── 8. Loop per page (1 page = 1 SerpAPI call = 1 credit = up to 20 data) ──
  for (let pageNum = 1; pageNum <= targetPages; pageNum++) {
    const serpStart = (pageNum - 1) * ROWS_PER_CREDIT; // 0, 20, 40, ...

    // 8a. Cek cache
    const cached = await getCacheBlock(adminClient, cacheKey, pageNum);

    if (cached) {
      // Cache Hit
      allResults.push(...(cached.data as PlaceResult[]));
      pagesProcessed++;
      if (cached.is_end_of_results) break;
      continue;
    }

    // 8b. Cache Miss → fetch SerpAPI
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_maps');
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('type', 'search');
    url.searchParams.set('api_key', activeKey.api_key);
    url.searchParams.set('start', String(serpStart));

    let serpData: any;
    try {
      serpData = await fetchSerpPage(url.toString());
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        partialReturn = true;
        break;
      }
      if (isQuotaError(err.message || '')) {
        quotaExhausted = true;
        await adminClient.from('serp_api_keys').update({ quota_exhausted: true }).eq('id', activeKey.id);
      }
      break;
    }

    if (serpData?.error) {
      if (isQuotaError(String(serpData.error))) {
        quotaExhausted = true;
        await adminClient.from('serp_api_keys').update({ quota_exhausted: true }).eq('id', activeKey.id);
      }
      break;
    }

    const rawPlaces: any[] = serpData.local_results || [];
    const isEndOfResults = rawPlaces.length === 0 || !serpData.serpapi_pagination?.next;
    const parsed = parsePlaces(rawPlaces, keywordsList[0], province, city, district, village);

    // 8c. Simpan ke cache — HARUS di-await (serverless kill process setelah return)
    if (parsed.length > 0) {
      await saveCacheBlock(adminClient, cacheKey, pageNum, parsed, isEndOfResults);
    }

    allResults.push(...parsed);
    pagesProcessed++;

    if (isEndOfResults) break;
  }

  // ─── 9. Potong kredit sesudah berhasil ────────────────────────────────────
  if (!isSuperAdmin && isActivated && pagesProcessed > 0) {
    const purchasedCredits = profile?.purchased_credits ?? 0;
    await adminClient.from('profiles')
      .update({ purchased_credits: purchasedCredits - pagesProcessed })
      .eq('id', user.id);
  }

  const finalResults = allResults.slice(0, effectiveMaxRows);

  const headers: Record<string, string> = {};
  if (partialReturn) headers['X-Partial-Results'] = 'true';
  if (quotaExhausted) headers['X-Quota-Exhausted'] = 'true';
  headers['X-Is-Free-User'] = 'false';
  headers['X-Rows-Fetched'] = String(finalResults.length);
  headers['X-Pages-Processed'] = String(pagesProcessed);
  headers['X-Credits-Used'] = String(pagesProcessed);

  return NextResponse.json(finalResults, { headers });
}

// ─── Free User: flow lama (tanpa cache) ───────────────────────────────────────

async function handleFreeUserScrape(
  adminClient: ReturnType<typeof createAdminClient>,
  keyword: string,
  city: string,
  district: string,
  village: string,
  province: string,
  effectiveMaxRows: number
): Promise<NextResponse> {
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

  const maxPages = Math.ceil(effectiveMaxRows / 20);

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
        if (err.message === 'TIMEOUT') { partialReturn = true; break; }
        if (isQuotaError(err.message || '')) {
          quotaExhausted = true;
          await adminClient.from('serp_api_keys').update({ quota_exhausted: true }).eq('id', activeKey.id);
        }
        break;
      }

      if (results?.error) {
        if (isQuotaError(String(results.error))) {
          quotaExhausted = true;
          await adminClient.from('serp_api_keys').update({ quota_exhausted: true }).eq('id', activeKey.id);
        }
        break;
      }

      const places = results.local_results || [];
      if (places.length === 0) break;

      for (const place of places) {
        if (data.length >= effectiveMaxRows) break;
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

  const headers: Record<string, string> = {};
  if (partialReturn) headers['X-Partial-Results'] = 'true';
  if (quotaExhausted) headers['X-Quota-Exhausted'] = 'true';
  headers['X-Is-Free-User'] = 'true';
  headers['X-Rows-Fetched'] = String(data.length);

  return NextResponse.json(data, { headers });
}
