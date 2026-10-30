import { createClient } from './client';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Uploads an item photograph to Supabase Storage bucket 'item-photos'
 */
export async function uploadItemPhoto(
  file: File,
  userId: string
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      url: null,
      error: 'Invalid file format. Only JPG, PNG, and WebP images are permitted.',
    };
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return {
      url: null,
      error: 'File size exceeds 5MB limit. Please choose a smaller photo.',
    };
  }

  try {
    const supabase = createClient();

    // Sanitize filename and create unique storage path
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const filePath = `${userId}/${Date.now()}_${cleanName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('item-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('item-photos')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Storage upload failed';
    return { url: null, error: message };
  }
}

