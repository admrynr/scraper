-- Migration: Add snap_token to activation_requests for payment resumption
-- Allows reusing existing Midtrans token if user closes popup and tries again

ALTER TABLE public.activation_requests 
  ADD COLUMN IF NOT EXISTS snap_token TEXT,
  ADD COLUMN IF NOT EXISTS snap_token_expires_at TIMESTAMPTZ;
