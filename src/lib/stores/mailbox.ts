import { supabase, type AttarMailbox } from '$lib/supabase';
import { profile, refreshProfile, ensureValidSession, refreshSession } from './auth';
import { get } from 'svelte/store';

export type SendLetterResult = {
	success: boolean;
	error?: string;
	letter_id?: string;
	moons_awarded?: number;
};

export type VoteResult = {
	success: boolean;
	error?: string;
	moons_spent?: number;
	remaining_moons?: number;
	available?: number;
	required?: number;
};

// Check how many letters user sent today
export async function getLetterCountToday(): Promise<number> {
	const currentProfile = get(profile);
	if (!currentProfile) return 0;
	
	const { data, error } = await supabase.rpc('get_letter_count_today', {
		p_user_id: currentProfile.user_id
	});
	
	if (error) {
		console.error('Error getting letter count:', error);
		return 0;
	}
	
	return data ?? 0;
}

// Check if user can send a letter today
export async function canSendLetter(): Promise<boolean> {
	const currentProfile = get(profile);
	if (!currentProfile) return false;
	
	const { data, error } = await supabase.rpc('can_send_letter', {
		p_user_id: currentProfile.user_id
	});
	
	if (error) {
		console.error('Error checking can send:', error);
		return false;
	}
	
	return data ?? false;
}

// Send a letter to Attar (uses RPC for atomic operation, with session validation)
export async function sendLetter(subject: string, content: string): Promise<SendLetterResult> {
	// Ensure session is valid before sending
	const sessionValid = await ensureValidSession();
	if (!sessionValid) {
		const refreshed = await refreshSession();
		if (!refreshed) {
			return { success: false, error: 'Session expired. Please refresh the page.' };
		}
		await refreshProfile();
	}
	
	const currentProfile = get(profile);
	if (!currentProfile) {
		return { success: false, error: 'Not logged in' };
	}
	
	const { data, error } = await supabase.rpc('send_letter', {
		p_user_id: currentProfile.user_id,
		p_subject: subject,
		p_content: content
	});
	
	if (error) {
		console.error('Error sending letter:', error);
		
		// If auth error, try refreshing and retry once
		if (isAuthError(error)) {
			const refreshed = await refreshSession();
			if (refreshed) {
				await refreshProfile();
				const retryProfile = get(profile);
				if (retryProfile) {
					const { data: retryData, error: retryError } = await supabase.rpc('send_letter', {
						p_user_id: retryProfile.user_id,
						p_subject: subject,
						p_content: content
					});
					
					if (retryError) {
						return { success: false, error: retryError.message };
					}
					
					const retryResult = retryData as SendLetterResult;
					if (retryResult.success) {
						await refreshProfile();
					}
					return retryResult;
				}
			}
		}
		
		return { success: false, error: error.message };
	}
	
	const result = data as SendLetterResult;
	
	// Refresh profile to get updated moon count
	if (result.success) {
		await refreshProfile();
	}
	
	return result;
}

// Check if error is auth-related
function isAuthError(error: any): boolean {
	if (!error) return false;
	const message = error.message?.toLowerCase() || '';
	return (
		message.includes('jwt') ||
		message.includes('token') ||
		message.includes('unauthorized') ||
		message.includes('auth')
	);
}

// Vote on a letter using moons (with session validation and retry)
export async function voteOnLetter(letterId: string, moonAmount: number): Promise<VoteResult> {
	// Ensure session is valid before voting
	const sessionValid = await ensureValidSession();
	if (!sessionValid) {
		console.warn('Session invalid before letter vote, refreshing...');
		const refreshed = await refreshSession();
		if (!refreshed) {
			return { success: false, error: 'Session expired. Please refresh the page.' };
		}
		await refreshProfile();
	}
	
	const currentProfile = get(profile);
	if (!currentProfile) {
		return { success: false, error: 'Not logged in' };
	}
	
	const { data, error } = await supabase.rpc('vote_on_letter', {
		p_user_id: currentProfile.user_id,
		p_letter_id: letterId,
		p_moon_amount: moonAmount
	});
	
	if (error) {
		console.error('Error voting on letter:', error);
		
		// If auth error, try refreshing session and retry once
		if (isAuthError(error)) {
			console.warn('Auth error during letter vote, refreshing and retrying...');
			const refreshed = await refreshSession();
			if (refreshed) {
				await refreshProfile();
				const retryProfile = get(profile);
				if (retryProfile) {
					const { data: retryData, error: retryError } = await supabase.rpc('vote_on_letter', {
						p_user_id: retryProfile.user_id,
						p_letter_id: letterId,
						p_moon_amount: moonAmount
					});
					
					if (retryError) {
						return { success: false, error: retryError.message };
					}
					
					const retryResult = retryData as VoteResult;
					if (retryResult.success) {
						await refreshProfile();
					}
					return retryResult;
				}
			}
		}
		
		return { success: false, error: error.message };
	}
	
	const result = data as VoteResult;
	
	// Refresh profile to get updated moon count
	if (result.success) {
		await refreshProfile();
	}
	
	return result;
}

// Get published letters with author info
export async function getPublishedLetters(limit = 50, offset = 0): Promise<AttarMailbox[]> {
	const { data, error } = await supabase
		.from('attar_mailbox')
		.select('*')
		.eq('published', true)
		.order('received_moons', { ascending: false })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);
	
	if (error) {
		console.error('Error fetching letters:', error);
		return [];
	}
	
	return data;
}

// Get user's own letters
export async function getMyLetters(): Promise<AttarMailbox[]> {
	const currentProfile = get(profile);
	if (!currentProfile) return [];
	
	const { data, error } = await supabase
		.from('attar_mailbox')
		.select('*')
		.eq('user_id', currentProfile.user_id)
		.order('created_at', { ascending: false });
	
	if (error) {
		console.error('Error fetching my letters:', error);
		return [];
	}
	
	return data;
}

// Delete own unpublished letter
export async function deleteLetter(letterId: string): Promise<boolean> {
	const currentProfile = get(profile);
	if (!currentProfile) return false;
	
	const { error } = await supabase
		.from('attar_mailbox')
		.delete()
		.eq('id', letterId)
		.eq('user_id', currentProfile.user_id)
		.eq('published', false);
	
	if (error) {
		console.error('Error deleting letter:', error);
		return false;
	}
	
	return true;
}
