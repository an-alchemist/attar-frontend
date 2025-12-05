import { supabase } from '$lib/supabase';
import { profile, refreshProfile } from '$lib/stores/auth';
import { get } from 'svelte/store';

// Spend moons
export async function spendMoons(amount: number): Promise<boolean> {
	const p = get(profile);
	if (!p || p.available_moons < amount) return false;

	const { data, error } = await supabase.rpc('spend_moons', {
		p_user_id: p.user_id,
		p_amount: amount
	});

	if (error) {
		console.error('Error spending moons:', error);
		return false;
	}

	await refreshProfile();
	return data;
}

// Vote on environment decision
export async function voteOnDecision(envId: string, choiceIndex: number, moonAmount: number): Promise<boolean> {
	const p = get(profile);
	if (!p) return false;

	const success = await spendMoons(moonAmount);
	if (!success) return false;

	const [voteResult, updateResult] = await Promise.all([
		supabase
			.from('attar_votes')
			.insert({
				user_id: p.user_id,
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

	return true;
}
