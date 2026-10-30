'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface ClaimActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Submit an ownership claim for a found item
 */
export async function submitClaimAction(
  prevState: ClaimActionResult | null,
  formData: FormData
): Promise<ClaimActionResult> {
  const itemId = formData.get('itemId') as string;
  const proofDescription = formData.get('proofDescription') as string;
  const verificationAnswer = formData.get('verificationAnswer') as string;

  if (!itemId || !proofDescription?.trim()) {
    return { error: 'Please provide proof of ownership details describing your item.' };
  }

  const supabase = await createClient();

  // 1. Verify user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectedFrom=/claims/submit?itemId=${itemId}`);
  }

  // 2. Fetch item to verify item status and ensure claimant is not the finder
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, user_id, item_type, status')
    .eq('id', itemId)
    .single();

  if (itemError || !item) {
    return { error: 'The requested item was not found.' };
  }

  if (item.item_type !== 'found') {
    return { error: 'Claims can only be filed against found belongings.' };
  }

  if (item.status === 'recovered' || item.status === 'handed_over') {
    return { error: 'This item has already been recovered and closed. Claims are no longer accepted.' };
  }

  if (item.user_id === user.id) {
    return { error: 'You reported this item as found. You cannot file an ownership claim against an item you reported.' };
  }

  // 3. Prevent duplicate claims by the same student for the same item
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('id, status')
    .eq('item_id', itemId)
    .eq('claimant_id', user.id)
    .maybeSingle();

  if (existingClaim) {
    return {
      error: `You have already submitted a claim for this item (Status: ${existingClaim.status.toUpperCase()}). Please track it from your Claims Dashboard.`,
    };
  }

  // 4. Insert new claim with status 'pending'
  const { error: insertError } = await supabase.from('claims').insert({
    item_id: itemId,
    claimant_id: user.id,
    proof_description: proofDescription.trim(),
    verification_answer: verificationAnswer?.trim() || null,
    status: 'pending',
  });

  if (insertError) {
    // Handle unique constraint violation gracefully if caught at the DB level
    if (insertError.code === '23505') {
      return { error: 'You have already submitted a claim for this item.' };
    }
    return { error: `Claim submission failed: ${insertError.message}` };
  }

  redirect('/claims?submitted=true');
}

