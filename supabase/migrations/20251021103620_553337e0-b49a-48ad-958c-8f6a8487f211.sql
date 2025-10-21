-- Create storage bucket for group attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-attachments', 'group-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for group attachments bucket
CREATE POLICY "Users can upload attachments to their groups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Group members can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'group-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachments column to group_messages table
ALTER TABLE group_messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_group_messages_attachments 
ON group_messages USING gin(attachments);