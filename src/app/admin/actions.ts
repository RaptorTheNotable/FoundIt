'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AdminActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Asserts the current user has verified administrator privileges
 */
async function assertAdminSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Access denied: Authentication required.');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    throw new Error('Access denied: Administrator privileges required.');
  }

  return { supabase, adminId: user.id };
}

/**
 * Move a pending claim to 'under_review'
 */
export async function markUnderReviewAction(claimId: string): Promise<AdminActionResult> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    // 1. Try atomic database RPC function first
    const { error: rpcError } = await supabase.rpc('mark_claim_under_review', {
      claim_uuid: claimId,
    });

    if (rpcError) {
      // Fallback to direct atomic updates if RPC is not deployed in local environment
      const { error: updateError } = await supabase
        .from('claims')
        .update({ status: 'under_review' })
        .eq('id', claimId)
        .eq('status', 'pending');

      if (updateError) {
        return { error: updateError.message };
      }

      // Log in audit_logs
      await supabase.from('audit_logs').insert({
        action: 'claim_under_review',
        performed_by: adminId,
        target_type: 'claim',
        target_id: claimId,
        details: { previous_status: 'pending' },
      });
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return { error: message };
  }
}

/**
 * Approve a claim and mark the item as claimed
 */
export async function approveClaimAction(
  claimId: string,
  adminNotes?: string
): Promise<AdminActionResult> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    // 1. Try atomic database RPC function
    const { error: rpcError } = await supabase.rpc('approve_claim', {
      claim_uuid: claimId,
      admin_notes_text: adminNotes || null,
    });

    if (rpcError) {
      // Fallback: verify claim and item directly
      const { data: claim, error: claimFetchError } = await supabase
        .from('claims')
        .select('id, item_id, claimant_id, status')
        .eq('id', claimId)
        .single();

      if (claimFetchError || !claim) {
        return { error: 'Claim not found.' };
      }

      if (claim.status !== 'pending' && claim.status !== 'under_review') {
        return { error: `Claim cannot be approved because status is ${claim.status}.` };
      }

      // Check if another claim is already approved
      const { data: existingApproved } = await supabase
        .from('claims')
        .select('id')
        .eq('item_id', claim.item_id)
        .eq('status', 'approved')
        .neq('id', claimId)
        .maybeSingle();

      if (existingApproved) {
        return { error: 'Another claim is already approved for this item. Cannot approve competing claims.' };
      }

      // Update claim
      const { error: updateError } = await supabase
        .from('claims')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', claimId);

      if (updateError) {
        return { error: updateError.message };
      }

      // Update item status to 'claimed'
      await supabase
        .from('items')
        .update({ status: 'claimed' })
        .eq('id', claim.item_id);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'claim_approved',
        performed_by: adminId,
        target_type: 'claim',
        target_id: claimId,
        details: {
          item_id: claim.item_id,
          claimant_id: claim.claimant_id,
          admin_notes: adminNotes || null,
        },
      });
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return { error: message };
  }
}

/**
 * Reject a claim with mandatory or optional feedback
 */
export async function rejectClaimAction(
  claimId: string,
  rejectionReason?: string
): Promise<AdminActionResult> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    // 1. Try atomic database RPC function
    const { error: rpcError } = await supabase.rpc('reject_claim', {
      claim_uuid: claimId,
      rejection_reason: rejectionReason || null,
    });

    if (rpcError) {
      // Fallback
      const { data: claim, error: fetchErr } = await supabase
        .from('claims')
        .select('id, item_id, claimant_id, status')
        .eq('id', claimId)
        .single();

      if (fetchErr || !claim) {
        return { error: 'Claim not found.' };
      }

      const { error: updateError } = await supabase
        .from('claims')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: rejectionReason || 'Claim could not be verified by administrator.',
        })
        .eq('id', claimId);

      if (updateError) {
        return { error: updateError.message };
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'claim_rejected',
        performed_by: adminId,
        target_type: 'claim',
        target_id: claimId,
        details: {
          item_id: claim.item_id,
          claimant_id: claim.claimant_id,
          rejection_reason: rejectionReason,
        },
      });
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return { error: message };
  }
}

/**
 * Complete physical handover at the campus help desk
 */
export async function completeHandoverAction(
  claimId: string,
  handoverNotes?: string
): Promise<AdminActionResult> {
  try {
    const { supabase, adminId } = await assertAdminSession();

    // 1. Try atomic database RPC function
    const { error: rpcError } = await supabase.rpc('complete_handover', {
      claim_uuid: claimId,
      handover_notes_text: handoverNotes || null,
    });

    if (rpcError) {
      // Fallback
      const { data: claim, error: fetchErr } = await supabase
        .from('claims')
        .select('id, item_id, claimant_id, status')
        .eq('id', claimId)
        .single();

      if (fetchErr || !claim) {
        return { error: 'Claim not found.' };
      }

      if (claim.status !== 'approved') {
        return { error: 'Handover can only be completed for approved claims.' };
      }

      // Check item
      const { data: item } = await supabase
        .from('items')
        .select('id, status')
        .eq('id', claim.item_id)
        .single();

      if (item?.status === 'recovered') {
        return { error: 'Item is already recovered. Cannot complete handover again.' };
      }

      // Insert handover record
      const { data: handover, error: handoverErr } = await supabase
        .from('handover_records')
        .insert({
          claim_id: claimId,
          item_id: claim.item_id,
          claimant_id: claim.claimant_id,
          admin_id: adminId,
          handover_notes: handoverNotes || null,
          claimant_confirmed: true,
          admin_confirmed: true,
        })
        .select('id')
        .single();

      if (handoverErr) {
        return { error: handoverErr.message };
      }

      // Update claim status to completed
      await supabase
        .from('claims')
        .update({ status: 'completed' })
        .eq('id', claimId);

      // Update item status to recovered and custody to handed_over
      await supabase
        .from('items')
        .update({ status: 'recovered', custody_status: 'handed_over' })
        .eq('id', claim.item_id);

      // Automatically reject remaining competing claims on this item
      await supabase
        .from('claims')
        .update({
          status: 'rejected',
          admin_notes: 'Item was recovered and handed over to verified owner.',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('item_id', claim.item_id)
        .neq('id', claimId)
        .in('status', ['pending', 'under_review']);

      // Audit log
      await supabase.from('audit_logs').insert({
        action: 'handover_completed',
        performed_by: adminId,
        target_type: 'handover',
        target_id: handover?.id || claimId,
        details: {
          claim_id: claimId,
          item_id: claim.item_id,
          claimant_id: claim.claimant_id,
          handover_notes: handoverNotes,
        },
      });
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return { error: message };
  }
}

