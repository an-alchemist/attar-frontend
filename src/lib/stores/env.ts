import { supabase, type AttarEnv } from '$lib/supabase';

export type EnvChoice = {
	id: string;
	title: string;
	description: string;
	votes: number;
};

export type CurrentEnv = {
	id: string;
	day: number;
	title: string;
	entityImageUrl: string | null;
	worldImageUrl: string | null;
	worldVideoUrl: string | null;
	choices: EnvChoice[];
	envDescription: string;
};

// Get the latest environment
export async function getLatestEnv(): Promise<CurrentEnv | null> {
	const { data, error } = await supabase
		.from('attar_env')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(1)
		.single();
	
	if (error) {
		console.error('Error fetching latest env:', error);
		return null;
	}
	
	if (!data) return null;
	
	const metadata = data.metadata as { day?: number; title?: string; env_description?: string } || {};
	const decisions = data.decisions as { choices?: Array<{ title: string; description: string; vote_count: number }> } || {};
	
	return {
		id: data.id,
		day: metadata.day ?? 0,
		title: metadata.title ?? 'Attar',
		entityImageUrl: data.entity_image_url,
		worldImageUrl: data.world_image_url,
		worldVideoUrl: data.world_video_url,
		choices: (decisions.choices || []).map((c, i) => ({
			id: `choice-${i}`,
			title: c.title,
			description: c.description,
			votes: c.vote_count || 0
		})),
		envDescription: metadata.env_description || ''
	};
}

// Get env by day number
export async function getEnvByDay(day: number): Promise<CurrentEnv | null> {
	const { data, error } = await supabase
		.from('attar_env')
		.select('*')
		.eq('metadata->>day', day.toString())
		.single();
	
	if (error) {
		console.error(`Error fetching env for day ${day}:`, error);
		return null;
	}
	
	if (!data) return null;
	
	const metadata = data.metadata as { day?: number; title?: string; env_description?: string } || {};
	const decisions = data.decisions as { choices?: Array<{ title: string; description: string; vote_count: number }> } || {};
	
	return {
		id: data.id,
		day: metadata.day ?? day,
		title: metadata.title ?? 'Attar',
		entityImageUrl: data.entity_image_url,
		worldImageUrl: data.world_image_url,
		worldVideoUrl: data.world_video_url,
		choices: (decisions.choices || []).map((c, i) => ({
			id: `choice-${i}`,
			title: c.title,
			description: c.description,
			votes: c.vote_count || 0
		})),
		envDescription: metadata.env_description || ''
	};
}

