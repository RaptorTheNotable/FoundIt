'use client';

import * as React from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ImageUploadProps {
  label?: string;
  helperText?: string;
  error?: string;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUpload({
  label = 'Photograph of Item',
  helperText = 'Upload a clear photograph (JPG, PNG, or WebP up to 5MB)',
  error,
  onFileSelect,
  disabled = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileSize, setFileSize] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or preview changes
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLocalError(null);

    if (!file) {
      return;
    }

    // 1. Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setLocalError('Invalid file type. Please upload a JPG, PNG, or WebP photograph.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError('File size exceeds the 5MB campus limit. Please compress or select a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Generate local preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    onFileSelect(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    setFileSize(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  const displayError = error || localError;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-brand-800">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="item-photograph-input"
      />

      {previewUrl ? (
        /* Image Preview Box */
        <div className="relative rounded-lg border border-brand-200 bg-white p-3 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md border border-brand-200 bg-brand-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Item preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 text-left space-y-1">
            <p className="text-xs font-semibold text-brand-900 truncate">
              {fileName}
            </p>
            <p className="text-[11px] text-brand-500">{fileSize}</p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Change Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="text-status-danger hover:bg-status-danger-bg"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Drag & Click Target */
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-200 bg-white/60 p-6 text-center cursor-pointer transition-colors hover:border-brand-400 hover:bg-brand-50/50',
            disabled && 'opacity-50 cursor-not-allowed hover:border-brand-200 hover:bg-white/60',
            displayError && 'border-status-danger/70 bg-status-danger-bg/20'
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 mb-2">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-brand-800">
            Click to upload photograph
          </p>
          <p className="text-[11px] text-brand-500 mt-0.5">{helperText}</p>
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-status-danger pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
