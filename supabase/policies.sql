-- ==============================================================================
-- FoundIt: Smart Campus Lost & Found Platform
-- Security: Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS across all application tables
ALTER TABLE public.campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. CAMPUS LOCATIONS
DROP POLICY IF EXISTS "Campus locations are publicly viewable" ON public.campus_locations;
CREATE POLICY "Campus locations are publicly viewable"
  ON public.campus_locations FOR SELECT
  USING (true);

-- 2. PROFILES
DROP POLICY IF EXISTS "Public profile basic read" ON public.profiles;
CREATE POLICY "Public profile basic read"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. UNIFIED ITEMS TABLE
-- Any student or visitor can browse reported lost & found items
DROP POLICY IF EXISTS "Public can view reported items" ON public.items;
CREATE POLICY "Public can view reported items"
  ON public.items FOR SELECT
  USING (true);

-- Authenticated students can report lost or found belongings
DROP POLICY IF EXISTS "Authenticated users can create items" ON public.items;
CREATE POLICY "Authenticated users can create items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reporters can update their own item, or campus administrators can update status
DROP POLICY IF EXISTS "Users can update own items and admins can update any" ON public.items;
CREATE POLICY "Users can update own items and admins can update any"
  ON public.items FOR UPDATE
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete own items or admins" ON public.items;
CREATE POLICY "Users can delete own items or admins"
  ON public.items FOR DELETE
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. PRIVATE IDENTIFIERS (STRICT VERIFICATION SECURITY)
-- Ordinary claimants CANNOT see the secret detail.
-- Only the finder (item reporter) or an administrator can view secret details.
DROP POLICY IF EXISTS "Only original reporter or admins can view private identifiers" ON public.private_identifiers;
CREATE POLICY "Only original reporter or admins can view private identifiers"
  ON public.private_identifiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Item reporter can insert the private identifier during found item reporting
DROP POLICY IF EXISTS "Reporters can insert private identifiers for their items" ON public.private_identifiers;
CREATE POLICY "Reporters can insert private identifiers for their items"
  ON public.private_identifiers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items WHERE id = item_id AND user_id = auth.uid()
    )
  );

-- 5. CLAIMS TABLE
-- Claimants can inspect their own claims; Administrators can review all claims
DROP POLICY IF EXISTS "Claimants see own claims, Admins see all" ON public.claims;
CREATE POLICY "Claimants see own claims, Admins see all"
  ON public.claims FOR SELECT
  USING (
    auth.uid() = claimant_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Submitting claims: prevent claims on recovered or closed items
DROP POLICY IF EXISTS "Authenticated students can submit ownership claims" ON public.claims;
CREATE POLICY "Authenticated students can submit ownership claims"
  ON public.claims FOR INSERT
  WITH CHECK (
    auth.uid() = claimant_id AND
    EXISTS (
      SELECT 1 FROM public.items
      WHERE id = item_id AND status NOT IN ('recovered', 'handed_over')
    )
  );

DROP POLICY IF EXISTS "Only admins can review and update claim statuses" ON public.claims;
CREATE POLICY "Only admins can review and update claim statuses"
  ON public.claims FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. HANDOVER RECORDS
DROP POLICY IF EXISTS "Claimants and admins can view handover records" ON public.handover_records;
CREATE POLICY "Claimants and admins can view handover records"
  ON public.handover_records FOR SELECT
  USING (
    auth.uid() = claimant_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create handover records" ON public.handover_records;
CREATE POLICY "Admins can create handover records"
  ON public.handover_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Claimant and admin can dual-confirm handover" ON public.handover_records;
CREATE POLICY "Claimant and admin can dual-confirm handover"
  ON public.handover_records FOR UPDATE
  USING (
    auth.uid() = claimant_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. AUDIT LOGS
-- Only administrators can read audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() = performed_by AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
