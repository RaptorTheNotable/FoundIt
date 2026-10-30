-- ==============================================================================
-- FoundIt: Smart Campus Lost & Found Platform
-- Supabase Storage: Bucket Creation & Security Policies
-- ==============================================================================

-- 1. Create the public storage bucket for item photographs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-photos',
  'item-photos',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage Policies

-- Anyone (students, visitors, admins) can view item photos
DROP POLICY IF EXISTS "Public Read Item Photos" ON storage.objects;
CREATE POLICY "Public Read Item Photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-photos');

-- Authenticated students can upload photos to the bucket
DROP POLICY IF EXISTS "Authenticated Users Upload Item Photos" ON storage.objects;
CREATE POLICY "Authenticated Users Upload Item Photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-photos' AND
    auth.role() = 'authenticated'
  );

-- Users can delete their own uploaded photos or admins can manage
DROP POLICY IF EXISTS "Users or Admins Delete Item Photos" ON storage.objects;
CREATE POLICY "Users or Admins Delete Item Photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'item-photos' AND (
      auth.uid() = owner OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

