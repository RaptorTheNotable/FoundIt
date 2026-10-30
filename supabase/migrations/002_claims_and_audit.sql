-- ==============================================================================
-- FoundIt: Smart Campus Lost & Found Platform
-- Migration: 002_claims_and_audit.sql
-- Description: Claim lifecycle, audit logging, atomic RPC functions & race condition guards
-- ==============================================================================

-- 1. UPDATE CLAIMS STATUS LIFECYCLE CONSTRAINT
-- Lifecycle: pending -> under_review -> approved/rejected -> completed
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;
ALTER TABLE public.claims ADD CONSTRAINT claims_status_check 
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed'));

-- 2. PREVENT DUPLICATE CLAIMS BY THE SAME STUDENT FOR THE SAME ITEM
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_claim_per_student_per_item
  ON public.claims (item_id, claimant_id);

-- 3. ENSURE PARTIAL UNIQUE INDEX FOR ONE APPROVED CLAIM PER ITEM
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_approved_claim_per_item
  ON public.claims (item_id)
  WHERE (status = 'approved');

-- 4. ADMINISTRATOR AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('claim_under_review', 'claim_approved', 'claim_rejected', 'handover_completed')),
  performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL DEFAULT 'claim' CHECK (target_type IN ('claim', 'item', 'handover')),
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 5. ATOMIC RPC FUNCTIONS FOR SECURE ADMINISTRATOR TRANSACTIONS

-- Function 5.1: Move claim to 'under_review'
CREATE OR REPLACE FUNCTION public.mark_claim_under_review(claim_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_claim RECORD;
BEGIN
  -- Verify admin role
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  SELECT * INTO v_claim FROM public.claims WHERE id = claim_uuid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim with ID % not found.', claim_uuid;
  END IF;

  IF v_claim.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending claims can be moved to under_review. Current status: %', v_claim.status;
  END IF;

  UPDATE public.claims
  SET status = 'under_review'
  WHERE id = claim_uuid;

  INSERT INTO public.audit_logs (action, performed_by, target_type, target_id, details)
  VALUES ('claim_under_review', v_admin_id, 'claim', claim_uuid, jsonb_build_object('previous_status', 'pending'));

  RETURN jsonb_build_object('success', true, 'status', 'under_review');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5.2: Atomic Claim Approval
CREATE OR REPLACE FUNCTION public.approve_claim(claim_uuid UUID, admin_notes_text TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_claim RECORD;
  v_item RECORD;
BEGIN
  -- Verify admin role
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  -- Lock claim row
  SELECT * INTO v_claim FROM public.claims WHERE id = claim_uuid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found.';
  END IF;

  IF v_claim.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Claim cannot be approved because status is %.', v_claim.status;
  END IF;

  -- Lock item row
  SELECT * INTO v_item FROM public.items WHERE id = v_claim.item_id FOR UPDATE;
  IF v_item.status IN ('recovered', 'handed_over') THEN
    RAISE EXCEPTION 'Item is already recovered/closed. Claims can no longer be approved.';
  END IF;

  -- Check if another claim is already approved for this item
  IF EXISTS (SELECT 1 FROM public.claims WHERE item_id = v_claim.item_id AND status = 'approved' AND id != claim_uuid) THEN
    RAISE EXCEPTION 'Another claim is already approved for this item.';
  END IF;

  -- Update claim status
  UPDATE public.claims
  SET status = 'approved',
      reviewed_by = v_admin_id,
      reviewed_at = NOW(),
      admin_notes = admin_notes_text
  WHERE id = claim_uuid;

  -- Update item status
  UPDATE public.items
  SET status = 'claimed',
      updated_at = NOW()
  WHERE id = v_claim.item_id;

  -- Log action
  INSERT INTO public.audit_logs (action, performed_by, target_type, target_id, details)
  VALUES (
    'claim_approved',
    v_admin_id,
    'claim',
    claim_uuid,
    jsonb_build_object(
      'item_id', v_claim.item_id,
      'claimant_id', v_claim.claimant_id,
      'admin_notes', admin_notes_text
    )
  );

  RETURN jsonb_build_object('success', true, 'status', 'approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5.3: Atomic Claim Rejection
CREATE OR REPLACE FUNCTION public.reject_claim(claim_uuid UUID, rejection_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_claim RECORD;
BEGIN
  -- Verify admin role
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  SELECT * INTO v_claim FROM public.claims WHERE id = claim_uuid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found.';
  END IF;

  IF v_claim.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Claim cannot be rejected because status is %.', v_claim.status;
  END IF;

  UPDATE public.claims
  SET status = 'rejected',
      reviewed_by = v_admin_id,
      reviewed_at = NOW(),
      admin_notes = rejection_reason
  WHERE id = claim_uuid;

  INSERT INTO public.audit_logs (action, performed_by, target_type, target_id, details)
  VALUES (
    'claim_rejected',
    v_admin_id,
    'claim',
    claim_uuid,
    jsonb_build_object(
      'item_id', v_claim.item_id,
      'claimant_id', v_claim.claimant_id,
      'rejection_reason', rejection_reason
    )
  );

  RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5.4: Atomic Physical Handover Completion
CREATE OR REPLACE FUNCTION public.complete_handover(claim_uuid UUID, handover_notes_text TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_claim RECORD;
  v_item RECORD;
  v_handover_id UUID;
BEGIN
  -- Verify admin role
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  -- Lock claim
  SELECT * INTO v_claim FROM public.claims WHERE id = claim_uuid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found.';
  END IF;

  IF v_claim.status != 'approved' THEN
    RAISE EXCEPTION 'Handover can only be completed for approved claims. Current status: %', v_claim.status;
  END IF;

  -- Lock item
  SELECT * INTO v_item FROM public.items WHERE id = v_claim.item_id FOR UPDATE;
  IF v_item.status = 'recovered' THEN
    RAISE EXCEPTION 'Item is already recovered. Cannot perform duplicate handover.';
  END IF;

  -- Create handover record
  INSERT INTO public.handover_records (
    claim_id,
    item_id,
    claimant_id,
    admin_id,
    handover_notes,
    handed_over_at,
    claimant_confirmed,
    admin_confirmed
  )
  VALUES (
    claim_uuid,
    v_claim.item_id,
    v_claim.claimant_id,
    v_admin_id,
    handover_notes_text,
    NOW(),
    TRUE,
    TRUE
  )
  RETURNING id INTO v_handover_id;

  -- Update claim status to completed
  UPDATE public.claims
  SET status = 'completed'
  WHERE id = claim_uuid;

  -- Update item status to recovered and custody to handed_over
  UPDATE public.items
  SET status = 'recovered',
      custody_status = 'handed_over',
      updated_at = NOW()
  WHERE id = v_claim.item_id;

  -- Automatically reject any other pending claims on this item
  UPDATE public.claims
  SET status = 'rejected',
      admin_notes = 'Item was recovered and handed over to verified owner.',
      reviewed_by = v_admin_id,
      reviewed_at = NOW()
  WHERE item_id = v_claim.item_id AND id != claim_uuid AND status IN ('pending', 'under_review');

  -- Log action
  INSERT INTO public.audit_logs (action, performed_by, target_type, target_id, details)
  VALUES (
    'handover_completed',
    v_admin_id,
    'handover',
    v_handover_id,
    jsonb_build_object(
      'claim_id', claim_uuid,
      'item_id', v_claim.item_id,
      'claimant_id', v_claim.claimant_id,
      'handover_notes', handover_notes_text
    )
  );

  RETURN jsonb_build_object('success', true, 'status', 'completed', 'handover_id', v_handover_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

