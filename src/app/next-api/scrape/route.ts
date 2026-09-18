import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { calculateScore, isPermanentlyClosed } from '@/lib/scoring';

export const maxDuration = 60;

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_DAILY_SCRAPE_LIMIT = 5;
const FREE_MAX_ROWS = 20;
/**
 * 1 app credit = 1 DataForSEO call = up to 20 Google Maps results.
 * Cache key: kombinasi query string + page_number (nomor call ke-berapa).
 */
const ROWS_PER_CREDIT = 20;
const MAX_SCRAPE_ROWS = 120; // Batas pagination (6 pages x 20)
const CACHE_TTL_HOURS = 24;
const DFS_FETCH_TIMEOUT_MS = 30000; // DataForSEO Live lebih lambat

// ─── DataForSEO Auth ──────────────────────────────────────────────────────────
function getDfsAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

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
  // New fields from DataForSEO for scoring
  is_claimed: boolean | null;
  business_status: string | null;
  work_hours: any | null;
  main_image: string | null;
  // Computed scoring fields
  score: number;
  score_label: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch dari DataForSEO Google Maps Live Advanced.
 * depth = jumlah hasil yang diminta (kelipatan 20).
 * location_code 2360 = Indonesia (DataForSEO country code).
 */
async function fetchDfsPage(
  searchQuery: string,
  depth: number
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DFS_FETCH_TIMEOUT_MS);

  const body = JSON.stringify([
    {
      keyword: searchQuery,
      location_code: 2360,   // Indonesia
      language_code: 'id',   // Bahasa Indonesia
      device: 'desktop',
      os: 'windows',
      depth: depth,
      search_places: true,
    },
  ]);

  try {
    const response = await fetch(
      'https://api.dataforseo.com/v3/serp/google/maps/live/advanced',
      {
        method: 'POST',
        headers: {
          Authorization: getDfsAuthHeader(),
          'Content-Type': 'application/json',
        },
        body,
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DataForSEO error (${response.status}): ${text}`);
    }

    const json = await response.json();
    const task = json?.tasks?.[0];
    if (!task) throw new Error('DataForSEO: no task in response');
    if (task.status_code !== 20000) {
      throw new Error(`DataForSEO task error ${task.status_code}: ${task.status_message}`);
    }
    return task;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

function isQuotaError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('payment') ||
    lower.includes('credit') ||
    lower.includes('quota') ||
    lower.includes('limit reached') ||
    lower.includes('40602') || // DataForSEO: task limit exceeded
    lower.includes('40006')    // DataForSEO: insufficient balance
  );
}

/**
 * Parse items dari DataForSEO Maps response ke PlaceResult[].
 * DataForSEO field mapping:
 *   title              → name
 *   address            → address
 *   phone              → phone
 *   url                → website
 *   rating.value       → rating
 *   rating.votes_count → reviews
 *   is_claimed         → is_claimed  (baru)
 *   business_status    → business_status  (baru — dipakai untuk filter permanently_closed)
 *   work_hours         → work_hours  (baru — untuk scoring jam operasional)
 *   main_image         → main_image  (baru — untuk scoring foto profil)
 */
function parsePlaces(
  items: any[],
  kw: string,
  province: string,
  city: string,
  district: string,
  village: string
): PlaceResult[] {
  return items
    .filter((item: any) => item.type === 'maps_search')
    // Hard filter: exclude bisnis yang permanently closed
    .filter((item: any) => !isPermanentlyClosed({ business_status: item.business_status }))
    .map((item: any) => {
      const base = {
        keyword_used: kw,
        name: item.title || null,
        address: item.address || null,
        phone: item.phone || null,
        website: item.url || null,
        rating: item.rating?.value ?? null,
        reviews: item.rating?.votes_count ?? null,
        province,
        city,
        district,
        village,
        is_claimed: item.is_claimed ?? null,
        business_status: item.business_status || null,
        work_hours: item.work_hours || null,
        main_image: item.main_image || null,
      };
      const { score, score_label } = calculateScore(base);
      return { ...base, score, score_label };
    });
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

  let effectiveMaxRows: number = Math.min(requestedMaxRows, MAX_SCRAPE_ROWS);

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
  // 1 credit = 1 DataForSEO call = up to 20 data
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

  // ─── 6. Cek DataForSEO credentials ────────────────────────────────────────
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    return NextResponse.json(
      { error: 'Konfigurasi search engine belum lengkap. Hubungi admin.' },
      { status: 503 }
    );
  }

  // ─── 7. Build query & cache key ───────────────────────────────────────────
  const locationParts: string[] = [];
  if (village) locationParts.push(village);
  if (district) locationParts.push(district);
  locationParts.push(city);
  if (province) locationParts.push(province);
  const locationStr = locationParts.join(', ');

  const keywordsList = keyword.split(',').map((k: string) => k.trim()).filter(Boolean);
  const searchQuery = `${keywordsList[0]} di ${locationStr}`;

  // Cache key = full query string lowercase (shared antar semua user)
  const cacheKey = searchQuery.toLowerCase();

  const allResults: PlaceResult[] = [];
  let pagesProcessed = 0;
  let quotaExhausted = false;
  let partialReturn = false;

  // ─── 8. Loop per page (1 page = 1 DataForSEO call = 1 credit = up to 20 data) ──
  // DataForSEO tidak support offset — kita request depth bertambah dan slice hasilnya.
  for (let pageNum = 1; pageNum <= targetPages; pageNum++) {
    const offset = (pageNum - 1) * ROWS_PER_CREDIT;

    // 8a. Cek cache
    const cached = await getCacheBlock(adminClient, cacheKey, pageNum);

    if (cached) {
      // Cache Hit
      allResults.push(...(cached.data as PlaceResult[]));
      pagesProcessed++;
      if (cached.is_end_of_results) break;
      continue;
    }

    // 8b. Cache Miss → fetch DataForSEO
    // Request depth = offset + 20 agar hasil halaman ini tersedia, lalu slice
    const depthNeeded = offset + ROWS_PER_CREDIT;

    let task: any;
    try {
      task = await fetchDfsPage(searchQuery, depthNeeded);
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        partialReturn = true;
        break;
      }
      if (isQuotaError(err.message || '')) {
        quotaExhausted = true;
      }
      break;
    }

    const allItems: any[] = task?.result?.[0]?.items || [];
    const pageItems = allItems.slice(offset, offset + ROWS_PER_CREDIT);
    const isEndOfResults = pageItems.length === 0 || allItems.length < depthNeeded;

    const parsed = parsePlaces(pageItems, keywordsList[0], province, city, district, village);

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

  // Sort by score descending (Hot leads first)
  const finalResults = allResults
    .slice(0, effectiveMaxRows)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const headers: Record<string, string> = {};
  if (partialReturn) headers['X-Partial-Results'] = 'true';
  if (quotaExhausted) headers['X-Quota-Exhausted'] = 'true';
  headers['X-Is-Free-User'] = 'false';
  headers['X-Rows-Fetched'] = String(finalResults.length);
  headers['X-Pages-Processed'] = String(pagesProcessed);
  headers['X-Credits-Used'] = String(pagesProcessed);

  return NextResponse.json(finalResults, { headers });
}

// ─── Free User: flow tanpa cache ──────────────────────────────────────────────

async function handleFreeUserScrape(
  adminClient: ReturnType<typeof createAdminClient>,
  keyword: string,
  city: string,
  district: string,
  village: string,
  province: string,
  effectiveMaxRows: number
): Promise<NextResponse> {
  // Cek DataForSEO credentials
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    return NextResponse.json(
      { error: 'Konfigurasi search engine belum lengkap. Hubungi admin.' },
      { status: 503 }
    );
  }

  const locationParts: string[] = [];
  if (village) locationParts.push(village);
  if (district) locationParts.push(district);
  locationParts.push(city);
  if (province) locationParts.push(province);
  const locationStr = locationParts.join(', ');

  const keywordsList = keyword.split(',').map((k: string) => k.trim()).filter(Boolean);
  const data: PlaceResult[] = [];
  const seenPlaces = new Set<string>();
  let quotaExhausted = false;
  let partialReturn = false;

  for (const kw of keywordsList) {
    if (partialReturn || data.length >= effectiveMaxRows) break;
    const searchQuery = `${kw} di ${locationStr}`;

    let task: any;
    try {
      // Free user: satu call dengan depth = effectiveMaxRows (max 20)
      task = await fetchDfsPage(searchQuery, effectiveMaxRows);
    } catch (err: any) {
      if (err.message === 'TIMEOUT') { partialReturn = true; break; }
      if (isQuotaError(err.message || '')) quotaExhausted = true;
      break;
    }

    const items: any[] = task?.result?.[0]?.items || [];
    const places = items
      .filter((item: any) => item.type === 'maps_search')
      .filter((item: any) => !isPermanentlyClosed({ business_status: item.business_status }));

    for (const place of places) {
      if (data.length >= effectiveMaxRows) break;
      const uniqueId = place.place_id || `${place.title}_${place.address}`;
      if (seenPlaces.has(uniqueId)) continue;
      seenPlaces.add(uniqueId);
      const base = {
        keyword_used: kw,
        name: place.title || null,
        address: place.address || null,
        phone: place.phone || null,
        website: place.url || null,
        rating: place.rating?.value ?? null,
        reviews: place.rating?.votes_count ?? null,
        province,
        city,
        district,
        village,
        is_claimed: place.is_claimed ?? null,
        business_status: place.business_status || null,
        work_hours: place.work_hours || null,
        main_image: place.main_image || null,
      };
      const { score, score_label } = calculateScore(base);
      data.push({ ...base, score, score_label });
    }
  }

  // Sort by score descending (Hot leads first)
  data.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const headers: Record<string, string> = {};
  if (partialReturn) headers['X-Partial-Results'] = 'true';
  if (quotaExhausted) headers['X-Quota-Exhausted'] = 'true';
  headers['X-Is-Free-User'] = 'true';
  headers['X-Rows-Fetched'] = String(data.length);

  return NextResponse.json(data, { headers });
}
