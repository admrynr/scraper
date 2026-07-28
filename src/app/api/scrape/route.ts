import { NextRequest, NextResponse } from 'next/server';

// Vercel serverless function config - extend timeout for scraping
export const maxDuration = 60; // seconds (requires Vercel Pro for >10s)

interface ScrapeRequestBody {
  apiKey: string;
  keyword: string;
  city: string;
  district?: string;
  village?: string;
  province?: string;
}

interface PlaceResult {
  keyword_used: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  province: string;
  city: string;
  district: string;
  village: string;
}

async function searchSerpAPI(params: Record<string, string>): Promise<any> {
  const url = new URL('https://serpapi.com/search.json');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SerpAPI request failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeRequestBody = await request.json();
    const { apiKey, keyword, city, district = '', village = '', province = '' } = body;

    if (!apiKey || !keyword || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey, keyword, and city are required' },
        { status: 400 }
      );
    }

    // Construct location string: "di village district city province"
    const locationParts: string[] = [];
    if (village) locationParts.push(village);
    if (district) locationParts.push(district);
    locationParts.push(city);
    if (province) locationParts.push(province);
    const locationStr = locationParts.join(' ');

    const keywordsList = keyword.split(',').map(k => k.trim()).filter(k => k);
    const data: PlaceResult[] = [];
    const seenPlaces = new Set<string>();

    for (const kw of keywordsList) {
      const searchQuery = `${kw} di ${locationStr}`;
      let start = 0;

      // Pagination loop — increment `start` by 20 each page (same as Python library)
      while (true) {
        const params: Record<string, string> = {
          engine: 'google_maps',
          q: searchQuery,
          type: 'search',
          api_key: apiKey,
          start: String(start),
        };

        let results: any;
        try {
          results = await searchSerpAPI(params);
        } catch (err) {
          // If a page fails, stop pagination for this keyword but don't throw
          console.error(`SerpAPI page error at start=${start}:`, err);
          break;
        }

        const places = results.local_results || [];
        if (places.length === 0) break;

        for (const place of places) {
          const placeId = place.place_id;
          const title = place.title || '';
          const address = place.address || '';

          // Deduplication
          const uniqueId = placeId || `${title}_${address}`;
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

        // If no more pages available, stop
        if (!results.serpapi_pagination?.next) break;

        // Move to next page
        start += 20;
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
