'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { uploadItemPhoto } from '@/lib/supabase/storage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS } from '@/lib/constants';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReportLostFormProps {
  userId: string;
}

export function ReportLostForm({ userId }: ReportLostFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [colour, setColour] = React.useState('');
  const [locationId, setLocationId] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = React.useState('');
  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('Submitting Report...');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const categoryOptions = ITEM_CATEGORIES.map((c) => ({ value: c, label: c }));
  const locationOptions = CAMPUS_LOCATIONS.map((l) => ({ value: l.id, label: l.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim() || !category || !colour.trim() || !locationId || !date || !description.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      let imageUrl: string | null = null;

      // 1. Upload photograph if provided
      if (imageFile) {
        setLoadingText('Uploading photograph to secure storage...');
        const uploadResult = await uploadItemPhoto(imageFile, userId);
        if (uploadResult.error) {
          setErrorMessage(`Photograph upload failed: ${uploadResult.error}`);
          setIsLoading(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      // 2. Insert into unified items table
      setLoadingText('Registering lost item in catalog...');
      const { error: insertError } = await supabase
        .from('items')
        .insert({
          user_id: userId,
          item_type: 'lost',
          title: title.trim(),
          category,
          brand: brand.trim() || null,
          colour: colour.trim(),
          description: description.trim(),
          location_id: locationId,
          date,
          image_url: imageUrl,
          status: 'reported',
        })
        .select()
        .single();

      if (insertError) {
        setErrorMessage(`Database submission failed: ${insertError.message}`);
        setIsLoading(false);
        return;
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
          <span>Lost report registered successfully! Redirecting to campus catalog...</span>
        </div>
      )}

      {/* Basic Item Info */}
      <div className="space-y-4">
        <Input
          label="Item Name / Title *"
          id="item-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Space Grey MacBook Air M2, Black Herschel Backpack"
          helperText="Give a clear, recognizable name for your lost belonging."
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
            placeholder="e.g. Navy Blue, Silver, Matte Black"
            disabled={isLoading || isSuccess}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Brand / Manufacturer (Optional)"
            id="item-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Apple, Sony, Casio, Nike"
            disabled={isLoading || isSuccess}
          />

          <Input
            label="Date Lost *"
            id="item-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isLoading || isSuccess}
          />
        </div>

        <Select
          label="Estimated Campus Location *"
          id="item-location"
          required
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          options={locationOptions}
          placeholder="Select campus building or area where last seen"
          disabled={isLoading || isSuccess}
        />

        <div className="w-full space-y-1.5">
          <label htmlFor="item-description" className="block text-xs font-semibold text-brand-800">
            Description & Context *
          </label>
          <textarea
            id="item-description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe visible features, stickers, wear marks, or circumstances where you misplaced it..."
            disabled={isLoading || isSuccess}
            className="flex w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:bg-brand-50 disabled:opacity-50 transition-colors"
          />
          <p className="text-xs text-brand-500">
            Provide details that help students or desk staff identify this item.
          </p>
        </div>
      </div>

      {/* Photograph Upload */}
      <div className="pt-2 border-t border-brand-100">
        <ImageUpload
          label="Reference Photograph (Optional)"
          helperText="Upload a previous photo of the item or invoice photo (JPG, PNG, WebP up to 5MB)"
          onFileSelect={setImageFile}
          disabled={isLoading || isSuccess}
        />
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
          {isLoading ? loadingText : 'Submit Lost Report'}
        </Button>
      </div>
    </form>
  );
}
