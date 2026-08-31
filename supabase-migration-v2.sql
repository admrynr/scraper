-- ============================================================
-- Prospekto CRM — Migration V2: Free/Paid Differentiation
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tambah kolom baru ke profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_activated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS purchased_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scrape_count_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scrape_last_date DATE,
  ADD COLUMN IF NOT EXISTS daily_credits INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS last_reset_date DATE;

-- 2. Table: activation_requests (untuk history transaksi Midtrans)
CREATE TABLE IF NOT EXISTS public.activation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('activation', 'topup')),
  amount INTEGER NOT NULL,           -- Nominal rupiah (misal 50000)
  credits INTEGER NOT NULL,          -- Credits yang akan diterima
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  midtrans_order_id TEXT UNIQUE,     -- Order ID dari Midtrans
  midtrans_transaction_id TEXT,      -- Transaction ID dari Midtrans
  midtrans_payment_type TEXT,        -- Metode bayar (gopay, bca_va, dll)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS untuk activation_requests
ALTER TABLE public.activation_requests ENABLE ROW LEVEL SECURITY;

-- User bisa lihat request mereka sendiri
CREATE POLICY "Users read own activation requests"
  ON public.activation_requests FOR SELECT
  USING (auth.uid() = user_id);

-- User bisa insert request mereka sendiri
CREATE POLICY "Users insert own activation requests"
  ON public.activation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin bisa lihat semua
CREATE POLICY "Admins read all activation requests"
  ON public.activation_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

-- Admin bisa update semua (untuk approve manual jika perlu)
CREATE POLICY "Admins update all activation requests"
  ON public.activation_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

-- 4. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_activation_requests_user_id ON public.activation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_requests_order_id ON public.activation_requests(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_activation_requests_status ON public.activation_requests(status);

-- 5. Trigger: auto update updated_at pada activation_requests
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_activation_requests_updated_at ON public.activation_requests;
CREATE TRIGGER set_activation_requests_updated_at
  BEFORE UPDATE ON public.activation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SELESAI! Cek hasil:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT * FROM public.activation_requests LIMIT 5;
-- ============================================================
