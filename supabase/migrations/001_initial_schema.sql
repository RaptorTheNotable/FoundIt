-- ==============================================================================
-- FoundIt: Smart Campus Lost & Found Platform
-- Migration: 001_initial_schema.sql
-- Description: Unified items table, profiles auto-sync trigger, enums & indexes
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAMPUS LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.campus_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  building_code TEXT NOT NULL DEFAULT 'MAIN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STUDENT & STAFF PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  department TEXT DEFAULT 'General',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatic trigger to populate public.profiles when an auth user registers
-- Invariant: Self-registration ALWAYS defaults to 'student' to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, department, roll_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    NEW.raw_user_meta_data->>'roll_number',
    'student' -- Explicitly hardcoded: prevents student self-promotion via metadata
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to prevent students from escalating their own role via profile updates
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being modified, verify that caller is an existing administrator.
  -- Direct database/dashboard edits (where auth.uid() IS NULL) are permitted.
  IF NEW.role != OLD.role THEN
    IF auth.uid() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
      NEW.role := OLD.role; -- Silently preserve existing role, rejecting escalation
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 3. UNIFIED ITEMS TABLE (Handles both 'lost' and 'found' belongings)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  colour TEXT NOT NULL,
  description TEXT NOT NULL,
  location_id TEXT NOT NULL REFERENCES public.campus_locations(id),
  date DATE NOT NULL,
  image_url TEXT,
  custody_status TEXT DEFAULT 'still_with_finder' CHECK (custody_status IN ('still_with_finder', 'deposited_at_help_desk', 'with_administrator', 'handed_over')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'claimed', 'verified', 'handed_over', 'recovered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRIVATE OWNERSHIP IDENTIFIERS (CONFIDENTIAL)
-- Holds sensitive verification answers (e.g., hidden markings, secret answers, internal contents)
CREATE TABLE IF NOT EXISTS public.private_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL UNIQUE REFERENCES public.items(id) ON DELETE CASCADE,
  secret_detail TEXT NOT NULL,
  prompt_question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. OWNERSHIP CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_description TEXT NOT NULL,
  verification_answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invariant: Exactly one approved claim per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_approved_claim_per_item
  ON public.claims (item_id)
  WHERE (status = 'approved');

-- 6. PHYSICAL HANDOVER CONFIRMATION TABLE
CREATE TABLE IF NOT EXISTS public.handover_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL UNIQUE REFERENCES public.claims(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  handover_notes TEXT,
  handed_over_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimant_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  admin_confirmed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Conventional Search & Filtering Performance Indexes
CREATE INDEX IF NOT EXISTS idx_items_type ON public.items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_location ON public.items(location_id);
CREATE INDEX IF NOT EXISTS idx_items_date ON public.items(date);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
