-- Migration: Enable RLS, policies, and add system_settings columns
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin to update suggestion status"
ON public.suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

INSERT INTO public.system_settings (auto_approve_suggestions)
VALUES (false);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can update system settings"
ON public.system_settings
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Allow authenticated users to read"
ON public.system_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- General settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT 'NepalReforms',
ADD COLUMN IF NOT EXISTS platform_url TEXT DEFAULT 'https://nepalreforms.com',
ADD COLUMN IF NOT EXISTS platform_description TEXT DEFAULT 'Empowering Nepal''s youth to shape democratic reforms',
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;

-- Security & user management
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS allow_registration BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_verification_required BOOLEAN DEFAULT TRUE;

-- Content settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS auto_approve_suggestions BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_agendas_per_page INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_suggestions_per_user INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS enable_comments BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS moderate_comments BOOLEAN DEFAULT FALSE;

-- Email settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS from_email TEXT DEFAULT 'noreply@nepalreforms.com',
ADD COLUMN IF NOT EXISTS from_name TEXT DEFAULT 'NepalReforms',
ADD COLUMN IF NOT EXISTS send_welcome_emails BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS send_notification_emails BOOLEAN DEFAULT TRUE;

-- Database settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS auto_backup BOOLEAN DEFAULT TRUE;

-- Optional timestamps
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE POLICY "Allow insert for authenticated"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
