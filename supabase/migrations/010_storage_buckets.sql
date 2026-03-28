-- Migration 010: Storage Buckets anlegen
-- Erstellt die benötigten Storage-Buckets falls sie noch nicht existieren

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152, -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'transcripts',
  'transcripts',
  false,
  10485760 -- 10 MB
)
ON CONFLICT (id) DO NOTHING;

-- RLS-Policies für logos-Bucket
-- Öffentliches Lesen (Bucket ist public, aber Policies trotzdem sicherheitshalber)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_public_read'
  ) THEN
    CREATE POLICY "logos_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'logos');
  END IF;
END $$;

-- Upload erlaubt für authentifizierte Nutzer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_auth_insert'
  ) THEN
    CREATE POLICY "logos_auth_insert" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Update erlaubt für authentifizierte Nutzer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_auth_update'
  ) THEN
    CREATE POLICY "logos_auth_update" ON storage.objects
      FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Löschen erlaubt für authentifizierte Nutzer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'logos_auth_delete'
  ) THEN
    CREATE POLICY "logos_auth_delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;
END $$;
