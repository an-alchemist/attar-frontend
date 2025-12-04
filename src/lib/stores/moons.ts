import { supabase } from '$lib/supabase';
import { profile, ensureValidSession, refreshSession, refreshProfile } from './auth';
import { get } from 'svelte/store';

// Check if error is auth-related
function isAuthError(error: any): boolean {
	if (!error) return false;
	const message = error.message?.toLowerCase() || '';
	const code = error.code || '';
	return (
		message.includes('jwt') ||
		message.includes('token') ||
		message.includes('unauthorized') ||
		message.includes('auth') ||
		code === 'PGRST301' ||
		code === '401' ||
		code === '403'
	);
}

// Spend moons (voting) with retry logic
async function spendMoonsInternal(amount: number): Promise<{ success: boolean; authError: boolean }> {
	const currentProfile = get(profile);
	if (!currentProfile) return { success: false, authError: false };
	
	if (currentProfile.available_moons < amount) {
		return { success: false, authError: false };
	}
	
	const { data, error } = await supabase.rpc('spend_moons', {
		p_user_id: currentProfile.user_id,
		p_amount: amount
	});
	
	if (error) {
		console.error('Error spending moons:', error);
		return { success: false, authError: isAuthError(error) };
	}
	
	if (data) {
		// Update local profile
		profile.update(p => p ? { ...p, available_moons: p.available_moons - amount } : null);
	}
	
	return { success: data, authError: false };
}

// Spend moons with session validation and retry
export async function spendMoons(amount: number): Promise<boolean> {
	// Ensure session is valid before attempting
	const sessionValid = await ensureValidSession();
	if (!sessionValid) {
		console.warn('Session invalid, attempting refresh...');
		const refreshed = await refreshSession();
		if (!refreshed) {
			console.error('Could not refresh session');
			return false;
		}
		await refreshProfile();
	}
	
	// First attempt
	const result = await spendMoonsInternal(amount);
	
	// If auth error, try refreshing session and retry once
	if (!result.success && result.authError) {
		console.warn('Auth error during spend, refreshing session and retrying...');
		const refreshed = await refreshSession();
		if (refreshed) {
			await refreshProfile();
			const retryResult = await spendMoonsInternal(amount);
			return retryResult.success;
		}
	}
	
	return result.success;
}

// Vote on a letter with retry logic
export async function voteOnLetter(letterId: string, moonAmount: number): Promise<{ success: boolean; error?: string }> {
	// Ensure session is valid
	const sessionValid = await ensureValidSession();
	if (!sessionValid) {
		const refreshed = await refreshSession();
		if (!refreshed) {
			return { success: false, error: 'Session expired. Please refresh the page.' };
		}
		await refreshProfile();
	}
	
	const currentProfile = get(profile);
	if (!currentProfile) return { success: false, error: 'Not logged in' };
	
	// Spend moons first
	const success = await spendMoons(moonAmount);
	if (!success) return { success: false, error: 'Could not spend moons' };
	
	// Record the vote
	const { error: voteError } = await supabase
		.from('attar_votes')
		.insert({
			user_id: currentProfile.user_id,
			votable_type: 'letter',
			votable_id: letterId,
			moon_amount: moonAmount
		});
	
	if (voteError) {
		console.error('Error recording vote:', voteError);
		return { success: false, error: 'Failed to record vote' };
	}
	
	// Add moons to the letter
	const { error: updateError } = await supabase.rpc('add_moons_to_letter', {
		p_letter_id: letterId,
		p_amount: moonAmount
	});
	
	if (updateError) {
		console.error('Error adding moons to letter:', updateError);
	}
	
	return { success: true };
}

// Vote on environment decision with retry logic
export async function voteOnDecision(envId: string, choiceIndex: number, moonAmount: number): Promise<boolean> {
	// Ensure session is valid
	const sessionValid = await ensureValidSession();
	if (!sessionValid) {
		console.warn('Session invalid before voting, refreshing...');
		const refreshed = await refreshSession();
		if (!refreshed) {
			console.error('Could not refresh session for voting');
			return false;
		}
		await refreshProfile();
	}
	
	const currentProfile = get(profile);
	if (!currentProfile) return false;
	
	// Spend moons first
	const success = await spendMoons(moonAmount);
	if (!success) return false;
	
	// Record the vote
	const { error: voteError } = await supabase
		.from('attar_votes')
		.insert({
			user_id: currentProfile.user_id,
			votable_type: 'env_decision',
			votable_id: envId,
			choice_index: choiceIndex,
			moon_amount: moonAmount
		});
	
	if (voteError) {
		console.error('Error recording vote:', voteError);
		// If auth error, try one more time after refresh
		if (isAuthError(voteError)) {
			console.warn('Auth error recording vote, retrying after refresh...');
			const refreshed = await refreshSession();
			if (refreshed) {
				const { error: retryError } = await supabase
					.from('attar_votes')
					.insert({
						user_id: currentProfile.user_id,
						votable_type: 'env_decision',
						votable_id: envId,
						choice_index: choiceIndex,
						moon_amount: moonAmount
					});
				if (retryError) {
					console.error('Retry also failed:', retryError);
					return false;
				}
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	
	// Add vote to the env decision
	const { error: updateError } = await supabase.rpc('add_vote_to_env', {
		p_env_id: envId,
		p_choice_index: choiceIndex,
		p_amount: moonAmount
	});
	
	if (updateError) {
		console.error('Error adding vote to env:', updateError);
	}
	
	return true;
}

// Get user's vote history
export async function getVoteHistory() {
	const currentProfile = get(profile);
	if (!currentProfile) return [];
	
	const { data, error } = await supabase
		.from('attar_votes')
		.select('*')
		.eq('user_id', currentProfile.user_id)
		.order('created_at', { ascending: false });
	
	if (error) {
		console.error('Error fetching vote history:', error);
		return [];
	}
	
	return data;
}

