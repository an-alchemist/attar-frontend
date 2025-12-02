-- Attar Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ATTAR_PROFILE
-- ============================================
CREATE TABLE attar_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    pseudoname TEXT NOT NULL DEFAULT 'Anonymous',
    avatar_url TEXT,
    available_moons INTEGER NOT NULL DEFAULT 13,
    receive_letters BOOLEAN NOT NULL DEFAULT TRUE,
    
    last_moon_refresh TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_attar_profile_user_id ON attar_profile(user_id);

-- ============================================
-- 2. ATTAR_MAILBOX
-- ============================================
CREATE TABLE attar_mailbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject VARCHAR(333) NOT NULL,
    content VARCHAR(3333) NOT NULL,
    received_moons INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attar_mailbox_user_id ON attar_mailbox(user_id);
CREATE INDEX idx_attar_mailbox_published ON attar_mailbox(published);

-- ============================================
-- 3. ATTAR_CAPABILITIES
-- ============================================
CREATE TABLE attar_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. ATTAR_ENV
-- ============================================
CREATE TABLE attar_env (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_image_url TEXT,
    world_image_url TEXT,
    world_video_url TEXT,
    decisions JSONB NOT NULL DEFAULT '{
        "choices": [
            {"title": "", "description": "", "vote_count": 0},
            {"title": "", "description": "", "vote_count": 0},
            {"title": "", "description": "", "vote_count": 0},
            {"title": "", "description": "", "vote_count": 0},
            {"title": "", "description": "", "vote_count": 0},
            {"title": "", "description": "", "vote_count": 0},
            {"title": "", "description": "", "vote_count": 0}
        ]
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. ATTAR_MEMORY
-- ============================================
CREATE TABLE attar_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity TEXT,
    new_knowledge JSONB DEFAULT '[]'::jsonb,
    interactions JSONB DEFAULT '[]'::jsonb,
    env_id UUID REFERENCES attar_env(id) ON DELETE SET NULL,
    capability_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attar_memory_env_id ON attar_memory(env_id);

-- ============================================
-- 6. ATTAR_BACKSTORY
-- ============================================
CREATE TABLE attar_backstory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sentence TEXT NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. ATTAR_VOTES
-- ============================================
CREATE TABLE attar_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    votable_type TEXT NOT NULL CHECK (votable_type IN ('letter', 'env_decision')),
    votable_id UUID NOT NULL,
    choice_index INTEGER CHECK (choice_index >= 0 AND choice_index <= 6),
    moon_amount INTEGER NOT NULL CHECK (moon_amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attar_votes_user_id ON attar_votes(user_id);
CREATE INDEX idx_attar_votes_votable ON attar_votes(votable_type, votable_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO attar_profile (user_id, pseudoname)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'pseudoname', 'Anonymous'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to refresh moons (call this or use cron)
CREATE OR REPLACE FUNCTION refresh_user_moons()
RETURNS void AS $$
BEGIN
    UPDATE attar_profile
    SET 
        available_moons = 13,
        last_moon_refresh = NOW(),
        updated_at = NOW()
    WHERE last_moon_refresh < DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend moons (atomic operation)
CREATE OR REPLACE FUNCTION spend_moons(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_available INTEGER;
BEGIN
    -- Get current moons with lock
    SELECT available_moons INTO v_available
    FROM attar_profile
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF v_available IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF v_available < p_amount THEN
        RETURN FALSE;
    END IF;
    
    UPDATE attar_profile
    SET 
        available_moons = available_moons - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add moons to a letter
CREATE OR REPLACE FUNCTION add_moons_to_letter(p_letter_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE attar_mailbox
    SET 
        received_moons = received_moons + p_amount,
        updated_at = NOW()
    WHERE id = p_letter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add moons to env decision
CREATE OR REPLACE FUNCTION add_vote_to_env(p_env_id UUID, p_choice_index INTEGER, p_amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE attar_env
    SET 
        decisions = jsonb_set(
            decisions,
            ARRAY['choices', p_choice_index::text, 'vote_count'],
            to_jsonb((decisions->'choices'->p_choice_index->>'vote_count')::integer + p_amount)
        ),
        updated_at = NOW()
    WHERE id = p_env_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE attar_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE attar_mailbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE attar_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attar_backstory ENABLE ROW LEVEL SECURITY;
ALTER TABLE attar_env ENABLE ROW LEVEL SECURITY;
ALTER TABLE attar_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE attar_capabilities ENABLE ROW LEVEL SECURITY;

-- ATTAR_PROFILE policies
CREATE POLICY "Users can view their own profile"
    ON attar_profile FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON attar_profile FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view other profiles (public info)"
    ON attar_profile FOR SELECT
    USING (true);

-- ATTAR_MAILBOX policies
CREATE POLICY "Users can view published letters"
    ON attar_mailbox FOR SELECT
    USING (published = true);

CREATE POLICY "Users can view their own letters"
    ON attar_mailbox FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create letters"
    ON attar_mailbox FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unpublished letters"
    ON attar_mailbox FOR UPDATE
    USING (auth.uid() = user_id AND published = false)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unpublished letters"
    ON attar_mailbox FOR DELETE
    USING (auth.uid() = user_id AND published = false);

-- ATTAR_VOTES policies
CREATE POLICY "Users can view their own votes"
    ON attar_votes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create votes"
    ON attar_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ATTAR_BACKSTORY policies (public read)
CREATE POLICY "Anyone can view backstory"
    ON attar_backstory FOR SELECT
    USING (true);

-- ATTAR_ENV policies (public read)
CREATE POLICY "Anyone can view env"
    ON attar_env FOR SELECT
    USING (true);

-- ATTAR_MEMORY policies (public read)
CREATE POLICY "Anyone can view memory"
    ON attar_memory FOR SELECT
    USING (true);

-- ATTAR_CAPABILITIES policies (public read)
CREATE POLICY "Anyone can view capabilities"
    ON attar_capabilities FOR SELECT
    USING (true);

-- ============================================
-- STORAGE BUCKET FOR AVATARS
-- ============================================

-- Create bucket (run separately if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attar-avatars', 'attar-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'attar-avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'attar-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'attar-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'attar-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION refresh_user_moons() TO authenticated;
GRANT EXECUTE ON FUNCTION spend_moons(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_moons_to_letter(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_vote_to_env(UUID, INTEGER, INTEGER) TO authenticated;

