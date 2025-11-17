-- Add RLS policies for deleting complaints
CREATE POLICY "Admins can delete any complaint"
ON public.complaints
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can delete own complaints"
ON public.complaints
FOR DELETE
USING (auth.uid() = student_id);

-- Add CASCADE delete for complaint_attachments when complaint is deleted
ALTER TABLE public.complaint_attachments
DROP CONSTRAINT IF EXISTS complaint_attachments_complaint_id_fkey;

ALTER TABLE public.complaint_attachments
ADD CONSTRAINT complaint_attachments_complaint_id_fkey
FOREIGN KEY (complaint_id)
REFERENCES public.complaints(id)
ON DELETE CASCADE;

-- Add CASCADE delete for comments when complaint is deleted
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_complaint_id_fkey;

ALTER TABLE public.comments
ADD CONSTRAINT comments_complaint_id_fkey
FOREIGN KEY (complaint_id)
REFERENCES public.complaints(id)
ON DELETE CASCADE;