-- ============================================================
-- Migration 0005: Activate all users who have verified their email
-- 
-- Background: Previously, users needed admin approval after email verification.
-- The new flow: email verification alone is sufficient to activate an account.
-- This migration activates all existing users whose email is already confirmed.
-- ============================================================

-- Activate all auth users that have confirmed their email but are still marked
-- as is_approved = false in profiles.
-- We join against auth.users to check email_confirmed_at.

UPDATE public.profiles p
SET
  is_approved = TRUE,
  updated_at  = NOW()
FROM auth.users u
WHERE
  p.id            = u.id
  AND p.is_approved = FALSE
  AND u.email_confirmed_at IS NOT NULL;
