-- Fix add_vote_to_env function to handle NULL vote_count values
CREATE OR REPLACE FUNCTION add_vote_to_env(p_env_id UUID, p_choice_index INTEGER, p_amount INTEGER)
RETURNS void AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Get current vote count, defaulting to 0 if null
    SELECT COALESCE((decisions->'choices'->p_choice_index->>'vote_count')::integer, 0)
    INTO current_count
    FROM attar_env
    WHERE id = p_env_id;
    
    -- Update with new count
    UPDATE attar_env
    SET 
        decisions = jsonb_set(
            decisions,
            ARRAY['choices', p_choice_index::text, 'vote_count'],
            to_jsonb(current_count + p_amount)
        ),
        updated_at = NOW()
    WHERE id = p_env_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix spend_moons to be more robust
CREATE OR REPLACE FUNCTION spend_moons(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_moons INTEGER;
BEGIN
    SELECT available_moons INTO current_moons
    FROM attar_profile
    WHERE user_id = p_user_id;
    
    IF current_moons IS NULL OR current_moons < p_amount THEN
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

-- Ensure choice_index column exists in attar_votes (for decision votes)
ALTER TABLE attar_votes ADD COLUMN IF NOT EXISTS choice_index INTEGER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION add_vote_to_env(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION spend_moons(UUID, INTEGER) TO authenticated;

