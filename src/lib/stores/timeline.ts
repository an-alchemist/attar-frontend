import { supabase } from '$lib/supabase';

export type TimelineChoice = {
	title: string;
	description: string;
	voteCount: number;
	votePercentage: number;
};

export type TimelineEntry = {
	id: string;
	day: number;
	title: string;
	envDescription: string;
	entityImageUrl: string | null;
	worldImageUrl: string | null;
	worldVideoUrl: string | null;
	choices: TimelineChoice[];
	winningChoice: TimelineChoice | null;
	createdAt: string;
};

// Get all environment entries for timeline (ordered by day descending - newest first)
export async function getTimelineEntries(): Promise<TimelineEntry[]> {
	const { data, error } = await supabase
		.from('attar_env')
		.select('*')
		.order('created_at', { ascending: false });
	
	if (error) {
		console.error('Error fetching timeline:', error);
		return [];
	}
	
	return data.map((env, index) => {
		const metadata = env.metadata as { day?: number; title?: string; env_description?: string } || {};
		const decisions = env.decisions as { choices?: Array<{ title: string; description: string; vote_count: number }> } || {};
		
		const choices = (decisions.choices || []).map(c => ({
			title: c.title,
			description: c.description,
			voteCount: c.vote_count || 0,
			votePercentage: 0 // Will calculate below
		}));
		
		// Calculate vote percentages
		const totalVotes = choices.reduce((sum, c) => sum + c.voteCount, 0);
		if (totalVotes > 0) {
			choices.forEach(c => {
				c.votePercentage = Math.round((c.voteCount / totalVotes) * 100);
			});
		}
		
		// Find winning choice (highest votes)
		const winningChoice = choices.length > 0 
			? choices.reduce((a, b) => a.voteCount > b.voteCount ? a : b)
			: null;
		
		return {
			id: env.id,
			day: metadata.day ?? (data.length - index),
			title: metadata.title ?? 'Untitled',
			envDescription: metadata.env_description || '',
			entityImageUrl: env.entity_image_url,
			worldImageUrl: env.world_image_url,
			worldVideoUrl: env.world_video_url,
			choices,
			winningChoice,
			createdAt: env.created_at
		};
	});
}

// Get single timeline entry by day
export async function getTimelineEntryByDay(day: number): Promise<TimelineEntry | null> {
	const { data, error } = await supabase
		.from('attar_env')
		.select('*')
		.eq('metadata->>day', day.toString())
		.single();
	
	if (error) {
		console.error(`Error fetching timeline entry for day ${day}:`, error);
		return null;
	}
	
	if (!data) return null;
	
	const metadata = data.metadata as { day?: number; title?: string; env_description?: string } || {};
	const decisions = data.decisions as { choices?: Array<{ title: string; description: string; vote_count: number }> } || {};
	
	const choices = (decisions.choices || []).map(c => ({
		title: c.title,
		description: c.description,
		voteCount: c.vote_count || 0,
		votePercentage: 0
	}));
	
	const totalVotes = choices.reduce((sum, c) => sum + c.voteCount, 0);
	if (totalVotes > 0) {
		choices.forEach(c => {
			c.votePercentage = Math.round((c.voteCount / totalVotes) * 100);
		});
	}
	
	const winningChoice = choices.length > 0 
		? choices.reduce((a, b) => a.voteCount > b.voteCount ? a : b)
		: null;
	
	return {
		id: data.id,
		day: metadata.day ?? day,
		title: metadata.title ?? 'Untitled',
		envDescription: metadata.env_description || '',
		entityImageUrl: data.entity_image_url,
		worldImageUrl: data.world_image_url,
		worldVideoUrl: data.world_video_url,
		choices,
		winningChoice,
		createdAt: data.created_at
	};
}

// Get timeline count
export async function getTimelineCount(): Promise<number> {
	const { count, error } = await supabase
		.from('attar_env')
		.select('*', { count: 'exact', head: true });
	
	if (error) {
		console.error('Error getting timeline count:', error);
		return 0;
	}
	
	return count || 0;
}

