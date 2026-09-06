-- ============================================================
-- Prospekto CRM — Migration V3: Search Cache Table
-- Jalankan di: Supabase Dashboard → SQL Editor
-- Panduan: guides/CREDITS_AND_CACHING.md
-- ============================================================

-- 1. Buat tabel search_cache
-- Setiap baris = 1 blok 100 hasil pencarian organik untuk keyword + page tertentu.
-- Cache ini bersifat shared (dipakai bersama semua user).
CREATE TABLE IF NOT EXISTS public.search_cache (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword      TEXT        NOT NULL,
  page_number  INTEGER     NOT NULL,   -- 1 = record 1-100, 2 = record 101-200, dst
  data         JSONB       NOT NULL,   -- array of organic result objects
  is_end_of_results BOOLEAN NOT NULL DEFAULT FALSE, -- true jika Google < 100 hasil & tidak ada next page
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index untuk performa query cache
CREATE INDEX IF NOT EXISTS idx_search_cache_keyword     ON public.search_cache (keyword);
CREATE INDEX IF NOT EXISTS idx_search_cache_keyword_page ON public.search_cache (keyword, page_number);
CREATE INDEX IF NOT EXISTS idx_search_cache_created_at  ON public.search_cache (created_at);

-- 3. RLS: diakses via service role dari backend, tidak perlu RLS publik
--    Tapi kita aktifkan RLS dan beri akses hanya ke service role agar aman.
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Tidak ada policy publik — hanya service_role (admin client) yang bisa akses.
-- Backend Next.js menggunakan adminClient (service role key) untuk operasi cache.

-- 4. (Opsional) Cron purge: hapus cache > 30 hari
--    Jalankan via pg_cron (Supabase Extensions → enable pg_cron) atau cron job eksternal.
--    Contoh query purge:
--    DELETE FROM public.search_cache WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================================
-- SELESAI! Cek hasil:
-- SELECT * FROM public.search_cache LIMIT 5;
-- SELECT COUNT(*) FROM public.search_cache;
-- ============================================================
