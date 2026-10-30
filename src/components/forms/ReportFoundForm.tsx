'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadItemPhoto } from '@/lib/supabase/storage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS, CUSTODY_STATUSES } from '@/lib/constants';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import type { CustodyStatus } from '@/types';

interface ReportFoundFormProps {
  userId: string;
}

export function ReportFoundForm({ userId }: ReportFoundFormProps) {
  const router = useRouter();

  // Public Item Details
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [colour, setColour] = React.useState('');
  const [locationId, setLocationId] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [custodyStatus, setCustodyStatus] = React.useState<CustodyStatus>('still_with_finder');
  const [description, setDescription] = React.useState('');
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  // Private Ownership Verification Fields (stored in private_identifiers table)
  const [hasPrivateVerification, setHasPrivateVerification] = React.useState(true);
  const [promptQuestion, setPromptQuestion] = React.useState('');
  const [secretDetail, setSecretDetail] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('Submitting Found Report...');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const categoryOptions = ITEM_CATEGORIES.map((c) => ({ value: c, label: c }));
  const locationOptions = CAMPUS_LOCATIONS.map((l) => ({ value: l.id, label: l.name }));
  const custodyOptions = CUSTODY_STATUSES.filter((c) => c.value !== 'handed_over' && c.value !== 'with_administrator');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Mandatory public fields validation
    if (!title.trim() || !category || !colour.trim() || !locationId || !date || !description.trim()) {
      setErrorMessage('Please fill in all mandatory public fields.');
      return;
    }

    // 2. Private verification validation (if toggled)
    if (hasPrivateVerification) {
      if (!promptQuestion.trim() || !secretDetail.trim()) {
        setErrorMessage('Please specify both the verification question and the secret expected answer, or disable private verification.');
        return;
      }
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      let imageUrl: string | null = null;

      // 1. Upload photograph if provided
      if (imageFile) {
        setLoadingText('Uploading photograph to secure campus storage...');
        const uploadResult = await uploadItemPhoto(imageFile, userId);
        if (uploadResult.error) {
          setErrorMessage(`Photograph upload failed: ${uploadResult.error}`);
          setIsLoading(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      // 2. Insert into unified items table
      setLoadingText('Registering found item in campus catalog...');
      const { data: itemData, error: insertError } = await supabase
        .from('items')
        .insert({
          user_id: userId,
          item_type: 'found',
          title: title.trim(),
          category,
          brand: brand.trim() || null,
          colour: colour.trim(),
          description: description.trim(),
          location_id: locationId,
          date,
          custody_status: custodyStatus,
          image_url: imageUrl,
          status: 'reported',
        })
        .select()
        .single();

      if (insertError || !itemData) {
        setErrorMessage(`Database submission failed: ${insertError?.message || 'Unknown database error'}`);
        setIsLoading(false);
        return;
      }

      // 3. Insert private ownership identifier in separate table if provided
      if (hasPrivateVerification && promptQuestion.trim() && secretDetail.trim()) {
        setLoadingText('Saving private ownership verification rules...');
        const { error: privateError } = await supabase
          .from('private_identifiers')
          .insert({
            item_id: itemData.id,
            prompt_question: promptQuestion.trim(),
            secret_detail: secretDetail.trim(),
          });

        if (privateError) {
          // Log warning if private detail failed, but item was created
          console.error('Failed to save private identifier:', privateError);
        }
      }

      setIsSuccess(true);
      setIsLoading(false);

      // Redirect after brief acknowledgement
      setTimeout(() => {
        router.push('/items');
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Feedback */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-md bg-status-danger-bg text-status-danger text-xs font-medium border border-[#E8BAC0]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Feedback */}
      {isSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-status-success-bg text-status-success text-xs font-medium border border-[#A3C7B9]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Found item registered successfully! Redirecting to campus catalog...</span>
        </div>
      )}

      {/* Public Item Information */}
      <div className="space-y-4">
        <Input
          label="Item Name / Title *"
          id="item-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Blue HydroFlask Bottle, Black Casio FX-991CW Calculator"
          helperText="Give a concise, descriptive name for the item found."
          disabled={isLoading || isSuccess}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category *"
            id="item-category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categoryOptions}
            placeholder="Select item category"
            disabled={isLoading || isSuccess}
          />

          <Input
            label="Primary Colour *"
            id="item-colour"
            required
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            placeholder="e.g. Silver, Matte Black, Blue"
            disabled={isLoading || isSuccess}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Brand / Manufacturer (Optional)"
            id="item-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. boAt, Casio, Apple, Milton"
            disabled={isLoading || isSuccess}
          />

          <Input
            label="Date Found *"
            id="item-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isLoading || isSuccess}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Campus Location Where Found *"
            id="item-location"
            required
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            options={locationOptions}
            placeholder="Select campus building or area"
            disabled={isLoading || isSuccess}
          />

          <Select
            label="Current Custody Location *"
            id="item-custody"
            required
            value={custodyStatus}
            onChange={(e) => setCustodyStatus(e.target.value as CustodyStatus)}
            options={custodyOptions}
            placeholder="Select custody status"
            disabled={isLoading || isSuccess}
          />
        </div>

        <div className="w-full space-y-1.5">
          <label htmlFor="item-description" className="block text-xs font-semibold text-brand-800">
            Public Visible Description *
          </label>
          <textarea
            id="item-description"
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the exterior appearance and where it was located (bench, classroom table, library rack)..."
            disabled={isLoading || isSuccess}
            className="flex w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:bg-brand-50 disabled:opacity-50 transition-colors"
          />
          <p className="text-xs text-brand-500">
            Keep private markings confidential. Do not reveal serial numbers or secret contents here.
          </p>
        </div>
      </div>

      {/* Photograph Upload */}
      <div className="pt-2 border-t border-brand-100">
        <ImageUpload
          label="Photograph of Found Item"
          helperText="Upload a photo of the item (JPG, PNG, WebP up to 5MB)"
          onFileSelect={setImageFile}
          disabled={isLoading || isSuccess}
        />
      </div>

      {/* Private Ownership Verification Section */}
      <div className="pt-4 border-t border-brand-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-brand-100 text-brand-800">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                Private Ownership Verification
              </h4>
              <p className="text-[11px] text-brand-600">
                Stored in a separate restricted table. Never visible to students browsing the catalog.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-brand-800 select-none">
            <input
              type="checkbox"
              checked={hasPrivateVerification}
              onChange={(e) => setHasPrivateVerification(e.target.checked)}
              className="rounded border-brand-300 text-brand-700 focus:ring-brand-600"
              disabled={isLoading || isSuccess}
            />
            <span>Enable Security Challenge</span>
          </label>
        </div>

        {hasPrivateVerification && (
          <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 space-y-3">
            <Input
              label="Verification Question for Claimant *"
              id="prompt-question"
              required={hasPrivateVerification}
              value={promptQuestion}
              onChange={(e) => setPromptQuestion(e.target.value)}
              placeholder="e.g. What sticker is affixed to the back?, What is engraved inside?"
              helperText="The potential owner must answer this question when submitting an ownership claim."
              disabled={isLoading || isSuccess}
            />

            <Input
              label="Expected Secret Answer (Confidential — Administrators Only) *"
              id="secret-detail"
              required={hasPrivateVerification}
              value={secretDetail}
              onChange={(e) => setSecretDetail(e.target.value)}
              placeholder="e.g. Red Ferrari sticker, Initials 'S.K.' scratched on bottom"
              helperText="Only campus administrators can compare this during claim verification."
              disabled={isLoading || isSuccess}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-brand-200 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => router.back()}
          disabled={isLoading || isSuccess}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="md"
          isLoading={isLoading}
          disabled={isLoading || isSuccess}
        >
          {isLoading ? loadingText : 'Submit Found Report'}
        </Button>
      </div>
    </form>
  );
}
