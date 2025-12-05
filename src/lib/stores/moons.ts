import { supabase } from '$lib/supabase';
import { profile, refreshProfile } from './auth';
import { get } from 'svelte/store';

// Spend moons (voting) - updates local state immediately
export async function spendMoons(amount: number): Promise<boolean> {
	const currentProfile = get(profile);
	if (!currentProfile) return false;
	
	if (currentProfile.available_moons < amount) {
		return false;
	}
	
	// OPTIMISTIC: Update local state IMMEDIATELY (don't wait for server)
	profile.update(p => p ? { ...p, available_moons: p.available_moons - amount } : null);
	
	const { data, error } = await supabase.rpc('spend_moons', {
		p_user_id: currentProfile.user_id,
		p_amount: amount
	});
	
	if (error) {
		console.error('Error spending moons:', error);
		// Rollback optimistic update
		profile.update(p => p ? { ...p, available_moons: p.available_moons + amount } : null);
		return false;
	}
	
	return data;
}

// Vote on environment decision - OPTIMIZED: parallel calls + no blocking refreshProfile
export async function voteOnDecision(envId: string, choiceIndex: number, moonAmount: number): Promise<boolean> {
	const currentProfile = get(profile);
	if (!currentProfile) return false;
	
	// Spend moons first (this updates UI immediately via optimistic update)
	const success = await spendMoons(moonAmount);
	if (!success) return false;
	
	// Run BOTH calls in PARALLEL - they don't depend on each other
	const [voteResult, updateResult] = await Promise.all([
		// Record the vote
		supabase
			.from('attar_votes')
			.insert({
				user_id: currentProfile.user_id,
				votable_type: 'env_decision',
				votable_id: envId,
				choice_index: choiceIndex,
				moon_amount: moonAmount
			}),
		// Add vote to the env decision
		supabase.rpc('add_vote_to_env', {
			p_env_id: envId,
			p_choice_index: choiceIndex,
			p_amount: moonAmount
		})
	]);
	
	if (voteResult.error) {
		console.error('Error recording vote:', voteResult.error);
		return false;
	}
	
	if (updateResult.error) {
		console.error('Error adding vote to env:', updateResult.error);
		// Vote was recorded, just log the error
	}
	
	// Fire and forget - don't wait for profile refresh
	// The optimistic update already showed the new moon count
	refreshProfile().catch(e => console.warn('Background profile refresh failed:', e));
	
	return true;
}
