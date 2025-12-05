import { supabase } from '$lib/supabase';
import { authState, updateMoons, updateVoteCount } from '$lib/state.svelte';

// Spend moons - optimistic update
export async function spendMoons(amount: number): Promise<boolean> {
	if (!authState.profile) return false;

	if (authState.profile.available_moons < amount) {
		return false;
	}

	// Optimistic update
	updateMoons(-amount);

	const { data, error } = await supabase.rpc('spend_moons', {
		p_user_id: authState.profile.user_id,
		p_amount: amount
	});

	if (error) {
		console.error('Error spending moons:', error);
		// Rollback
		updateMoons(amount);
		return false;
	}

	return data;
}

// Vote on environment decision
export async function voteOnDecision(envId: string, choiceIndex: number, moonAmount: number): Promise<boolean> {
	if (!authState.profile) return false;

	// Spend moons (optimistic)
	const success = await spendMoons(moonAmount);
	if (!success) return false;

	// Update vote count optimistically
	updateVoteCount(choiceIndex, moonAmount);

	// Run both calls in parallel
	const [voteResult, updateResult] = await Promise.all([
		supabase
			.from('attar_votes')
			.insert({
				user_id: authState.profile.user_id,
				votable_type: 'env_decision',
				votable_id: envId,
				choice_index: choiceIndex,
				moon_amount: moonAmount
			}),
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
	}

	return true;
}
