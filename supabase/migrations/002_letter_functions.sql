-- Letter Functions Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- FUNCTION: Check if user can send letter today (max 3 per day)
-- ============================================
CREATE OR REPLACE FUNCTION can_send_letter(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM attar_mailbox
    WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC')
    AND created_at < DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day';
    
    RETURN v_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get user's letter count today
-- ============================================
CREATE OR REPLACE FUNCTION get_letter_count_today(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM attar_mailbox
    WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC')
    AND created_at < DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Send letter (with validation and moon reward)
-- ============================================
CREATE OR REPLACE FUNCTION send_letter(
    p_user_id UUID,
    p_subject VARCHAR(333),
    p_content VARCHAR(3333)
)
RETURNS JSON AS $$
DECLARE
    v_can_send BOOLEAN;
    v_letter_id UUID;
    v_result JSON;
BEGIN
    -- Check if user can send
    SELECT can_send_letter(p_user_id) INTO v_can_send;
    
    IF NOT v_can_send THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You can only send 3 letters per day'
        );
    END IF;
    
    -- Validate content length
    IF LENGTH(p_subject) > 333 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Subject too long (max 333 characters)'
        );
    END IF;
    
    IF LENGTH(p_content) > 3333 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Content too long (max 3333 characters)'
        );
    END IF;
    
    IF LENGTH(p_subject) < 1 OR LENGTH(p_content) < 1 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Subject and content are required'
        );
    END IF;
    
    -- Insert the letter
    INSERT INTO attar_mailbox (user_id, subject, content)
    VALUES (p_user_id, p_subject, p_content)
    RETURNING id INTO v_letter_id;
    
    -- Award 3 moons to the user
    UPDATE attar_profile
    SET 
        available_moons = available_moons + 3,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'letter_id', v_letter_id,
        'moons_awarded', 3
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Vote on a letter
-- ============================================
CREATE OR REPLACE FUNCTION vote_on_letter(
    p_user_id UUID,
    p_letter_id UUID,
    p_moon_amount INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_available_moons INTEGER;
    v_letter_exists BOOLEAN;
BEGIN
    -- Validate moon amount
    IF p_moon_amount < 1 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Must vote with at least 1 moon'
        );
    END IF;
    
    -- Check if letter exists and is published (or user owns it)
    SELECT EXISTS(
        SELECT 1 FROM attar_mailbox 
        WHERE id = p_letter_id 
        AND (published = true OR user_id = p_user_id)
    ) INTO v_letter_exists;
    
    IF NOT v_letter_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Letter not found or not accessible'
        );
    END IF;
    
    -- Check user's moon balance
    SELECT available_moons INTO v_available_moons
    FROM attar_profile
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF v_available_moons IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User profile not found'
        );
    END IF;
    
    IF v_available_moons < p_moon_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Not enough moons',
            'available', v_available_moons,
            'required', p_moon_amount
        );
    END IF;
    
    -- Deduct moons from user
    UPDATE attar_profile
    SET 
        available_moons = available_moons - p_moon_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record the vote
    INSERT INTO attar_votes (user_id, votable_type, votable_id, moon_amount)
    VALUES (p_user_id, 'letter', p_letter_id, p_moon_amount);
    
    -- Add moons to the letter
    UPDATE attar_mailbox
    SET 
        received_moons = received_moons + p_moon_amount,
        updated_at = NOW()
    WHERE id = p_letter_id;
    
    RETURN json_build_object(
        'success', true,
        'moons_spent', p_moon_amount,
        'remaining_moons', v_available_moons - p_moon_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT EXECUTE ON NEW FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION can_send_letter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_letter_count_today(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_letter(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION vote_on_letter(UUID, UUID, INTEGER) TO authenticated;

