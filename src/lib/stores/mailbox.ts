import { supabase, type AttarMailbox } from '$lib/supabase';
import { profile, refreshProfile } from '$lib/stores/auth';
import { get } from 'svelte/store';

export type SendLetterResult = {
	success: boolean;
	error?: string;
	letter?: AttarMailbox;
};

export type VoteResult = {
	success: boolean;
	error?: string;
	new_balance?: number;
};

// Get published letters
export async function getPublishedLetters(limit = 50): Promise<AttarMailbox[]> {
	const { data, error } = await supabase
		.from('attar_mailbox')
		.select('*')
		.eq('published', true)
		.order('received_moons', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching letters:', error);
		return [];
	}

	return data || [];
}

// Get letter count for today
export async function getLetterCountToday(): Promise<number> {
	const p = get(profile);
	if (!p) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const { count, error } = await supabase
		.from('attar_mailbox')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', p.user_id)
		.gte('created_at', today.toISOString());

	if (error) {
		console.error('Error getting letter count:', error);
		return 0;
	}

	return count || 0;
}

// Send a letter
export async function sendLetter(subject: string, content: string): Promise<SendLetterResult> {
	const p = get(profile);
	if (!p) return { success: false, error: 'Not logged in' };

	const { data, error } = await supabase.rpc('send_letter', {
		p_user_id: p.user_id,
		p_subject: subject,
		p_content: content
	});

	if (error) {
		console.error('Error sending letter:', error);
		return { success: false, error: error.message };
	}

	return data as SendLetterResult;
}

// Vote on a letter
export async function voteOnLetter(letterId: string, moonAmount: number): Promise<VoteResult> {
	const p = get(profile);
	if (!p) return { success: false, error: 'Not logged in' };

	const { data, error } = await supabase.rpc('vote_on_letter', {
		p_user_id: p.user_id,
		p_letter_id: letterId,
		p_moon_amount: moonAmount
	});

	if (error) {
		console.error('Error voting on letter:', error);
		return { success: false, error: error.message };
	}

	refreshProfile();
	return data as VoteResult;
}

// Get user's letters
export async function getUserLetters(): Promise<AttarMailbox[]> {
	const p = get(profile);
	if (!p) return [];

	const { data, error } = await supabase
		.from('attar_mailbox')
		.select('*')
		.eq('user_id', p.user_id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching user letters:', error);
		return [];
	}

	return data || [];
}
