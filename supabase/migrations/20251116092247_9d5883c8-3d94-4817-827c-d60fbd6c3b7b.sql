-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', false);

-- Create attachments table
CREATE TABLE public.complaint_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on attachments table
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;

-- Allow students to view attachments for their own complaints
CREATE POLICY "Students can view attachments for own complaints"
ON public.complaint_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM complaints
    WHERE complaints.id = complaint_attachments.complaint_id
    AND complaints.student_id = auth.uid()
  )
);

-- Allow admins to view all attachments
CREATE POLICY "Admins can view all attachments"
ON public.complaint_attachments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow students to insert attachments for their own complaints
CREATE POLICY "Students can insert attachments for own complaints"
ON public.complaint_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM complaints
    WHERE complaints.id = complaint_attachments.complaint_id
    AND complaints.student_id = auth.uid()
  )
  AND uploaded_by = auth.uid()
);

-- Storage policies for complaint attachments bucket
CREATE POLICY "Students can upload attachments for own complaints"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view own complaint attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all complaint attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-attachments'
  AND has_role(auth.uid(), 'admin'::app_role)
);