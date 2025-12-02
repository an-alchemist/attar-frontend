import { supabase } from '$lib/supabase';
import { profile } from './auth';
import { get } from 'svelte/store';

// Spend moons (voting)
export async function spendMoons(amount: number): Promise<boolean> {
	const currentProfile = get(profile);
	if (!currentProfile) return false;
	
	if (currentProfile.available_moons < amount) {
		return false;
	}
	
	const { data, error } = await supabase.rpc('spend_moons', {
		p_user_id: currentProfile.user_id,
		p_amount: amount
	});
	
	if (error) {
		console.error('Error spending moons:', error);
		return false;
	}
	
	if (data) {
		// Update local profile
		profile.update(p => p ? { ...p, available_moons: p.available_moons - amount } : null);
	}
	
	return data;
}

// Vote on a letter
export async function voteOnLetter(letterId: string, moonAmount: number): Promise<boolean> {
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
			votable_type: 'letter',
			votable_id: letterId,
			moon_amount: moonAmount
		});
	
	if (voteError) {
		console.error('Error recording vote:', voteError);
		return false;
	}
	
	// Add moons to the letter
	const { error: updateError } = await supabase.rpc('add_moons_to_letter', {
		p_letter_id: letterId,
		p_amount: moonAmount
	});
	
	if (updateError) {
		console.error('Error adding moons to letter:', updateError);
	}
	
	return true;
}

// Vote on environment decision
export async function voteOnDecision(envId: string, choiceIndex: number, moonAmount: number): Promise<boolean> {
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
		return false;
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

