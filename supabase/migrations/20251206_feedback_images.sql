-- Add images column to feedbacks
ALTER TABLE public.feedbacks 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];

-- Add images column to feedback_replies
ALTER TABLE public.feedback_replies 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];

-- Create storage bucket for feedback uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-uploads', 'feedback-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public access to view files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'feedback-uploads' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'feedback-uploads'
    AND auth.role() = 'authenticated'
);
