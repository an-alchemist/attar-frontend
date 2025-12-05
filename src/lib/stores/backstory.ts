import { supabase, type AttarBackstory } from '$lib/supabase';

export type BackstoryEntry = {
	day: number;
	text: string;
	reasoning: string | null;
};

// Fetch all backstory entries
export async function getBackstory(): Promise<BackstoryEntry[]> {
	const { data, error } = await supabase
		.from('attar_backstory')
		.select('*')
		.order('created_at', { ascending: true });
	
	if (error) {
		console.error('Error fetching backstory:', error);
		return [];
	}
	
	// Calculate day numbers based on order
	return data.map((entry, index) => ({
		day: index + 1,
		text: entry.sentence,
		reasoning: entry.reasoning
	}));
}

// Get latest backstory entry (single query with count)
export async function getLatestBackstory(): Promise<BackstoryEntry | null> {
	// Get latest entry AND count in one query using head:false
	const { data, error, count } = await supabase
		.from('attar_backstory')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.limit(1)
		.single();
	
	if (error) {
		console.error('Error fetching latest backstory:', error);
		return null;
	}
	
	return {
		day: count || 1,
		text: data.sentence,
		reasoning: data.reasoning
	};
}

// Get backstory count
export async function getBackstoryCount(): Promise<number> {
	const { count, error } = await supabase
		.from('attar_backstory')
		.select('*', { count: 'exact', head: true });
	
	if (error) {
		console.error('Error getting backstory count:', error);
		return 0;
	}
	
	return count || 0;
}

