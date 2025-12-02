-- Add metadata JSONB field to attar_env
-- metadata holds: { day: number, env_description: string, ... }

ALTER TABLE attar_env 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for querying by day number
CREATE INDEX IF NOT EXISTS idx_attar_env_metadata_day 
ON attar_env ((metadata->>'day'));

-- ============================================
-- STORAGE BUCKET FOR WORLDS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('attar-worlds', 'attar-worlds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for worlds bucket
CREATE POLICY "World assets are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'attar-worlds');

CREATE POLICY "Service role can upload world assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'attar-worlds');

CREATE POLICY "Service role can update world assets"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'attar-worlds');

CREATE POLICY "Service role can delete world assets"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'attar-worlds');

