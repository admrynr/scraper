-- ============================================================
-- Migration 0007: Fix activation_requests type CHECK constraint
-- Masalah: CHECK constraint hanya izinkan 'activation' dan 'topup',
--          tapi kode sekarang butuh: topup_lite, topup_pro, topup_agency, test_topup
-- ============================================================

-- Drop constraint lama
ALTER TABLE public.activation_requests
  DROP CONSTRAINT IF EXISTS activation_requests_type_check;

-- Tambah constraint baru dengan semua tipe yang valid
ALTER TABLE public.activation_requests
  ADD CONSTRAINT activation_requests_type_check
  CHECK (type IN ('activation', 'topup', 'topup_lite', 'topup_pro', 'topup_agency', 'test_topup'));

-- ============================================================
-- Verifikasi:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.activation_requests'::regclass AND contype = 'c';
-- ============================================================
