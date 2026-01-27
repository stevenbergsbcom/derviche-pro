-- ============================================
-- Migration 038: Fix externe role constraint
-- Derviche Diffusion
-- Date: 2025-01-27
-- Session: S94
-- ============================================
-- 
-- Problem: Database constraint expects 'externe-dd' but code uses 'externe'
-- Solution: Update CHECK constraint and existing data to use 'externe'
-- ============================================

-- 1. Update any existing 'externe-dd' roles to 'externe'
UPDATE public.user_roles 
SET role = 'externe' 
WHERE role = 'externe-dd';

-- 2. Drop the old constraint and add the new one
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('super-admin', 'admin', 'professional', 'company', 'externe'));

-- 3. Update comment
COMMENT ON COLUMN public.user_roles.role IS 'super-admin | admin | professional | company | externe';
