'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { submitClaimAction, type ClaimActionResult } from '@/app/claims/actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Lock } from 'lucide-react';

interface ClaimSubmitFormProps {
  itemId: string;
  promptQuestion?: string | null;
}

export function ClaimSubmitForm({ itemId, promptQuestion }: ClaimSubmitFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<ClaimActionResult | null, FormData>(
    submitClaimAction,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden item identifier */}
      <input type="hidden" name="itemId" value={itemId} />

      {/* Error Feedback */}
      {state?.error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-status-danger-bg text-status-danger text-xs font-medium border border-[#E8BAC0]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Private Verification Challenge (if item has prompt) */}
      {promptQuestion && (
        <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-900">
            <Lock className="w-3.5 h-3.5 text-brand-700" />
            <span>Security Verification Question</span>
          </div>
          <p className="text-xs text-brand-700 italic">
            &ldquo;{promptQuestion}&rdquo;
          </p>
          <Input
            label="Your Answer *"
            id="verificationAnswer"
            name="verificationAnswer"
            required
            placeholder="Type your answer to this challenge..."
            helperText="This answer will be reviewed by administrators to confirm your identity as the owner."
            disabled={isPending}
          />
        </div>
      )}

      {/* Proof of Ownership Description */}
      <div className="w-full space-y-1.5">
        <label htmlFor="proofDescription" className="block text-xs font-semibold text-brand-800">
          Proof of Ownership Details *
        </label>
        <textarea
          id="proofDescription"
          name="proofDescription"
          rows={5}
          required
          placeholder="Describe unique details that prove this belongs to you: e.g., purchase receipt details, serial number digits, sticker markings, bag contents, lock combination, or scratches..."
          disabled={isPending}
          className="flex w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:bg-brand-50 disabled:opacity-50 transition-colors"
        />
        <p className="text-xs text-brand-500">
          Please be as specific as possible. Administrators use these details to authorize collection.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-brand-200 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="md"
          isLoading={isPending}
          disabled={isPending}
        >
          {isPending ? 'Submitting Claim...' : 'Submit Claim for Review'}
        </Button>
      </div>
    </form>
  );
}

