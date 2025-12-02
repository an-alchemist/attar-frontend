import { supabase } from '$lib/supabase';

export type KnowledgeItem = {
	type: 'theme' | 'idea';
	value: string;
};

export type MemoryEntry = {
	id: string;
	day: number;
	identity: string | null;           // Latest backstory line
	newKnowledge: KnowledgeItem[];     // Themes + ideas learned
	interactions: string[];            // Pseudonyms who sent letters
	capabilityIds: string[];           // Future: unlocked abilities
	createdAt: string;
	// From linked env
	envId: string | null;
	envImageUrl: string | null;
	envVideoUrl: string | null;
	envTitle: string | null;
	envDescription: string | null;
};

// Get all memories with linked env data
export async function getMemories(): Promise<MemoryEntry[]> {
	// Fetch memories with env data
	const { data: memoriesData, error: memoriesError } = await supabase
		.from('attar_memory')
		.select(`
			*,
			attar_env (
				id,
				world_image_url,
				world_video_url,
				metadata
			)
		`)
		.order('created_at', { ascending: false });
	
	if (memoriesError) {
		console.error('Error fetching memories:', memoriesError);
		return [];
	}
	
	if (!memoriesData || memoriesData.length === 0) {
		// Fallback: if no memories, create entries from envs
		return getMemoriesFromEnvs();
	}
	
	return memoriesData.map((memory, index) => {
		const env = memory.attar_env;
		const metadata = env?.metadata as { day?: number; title?: string; env_description?: string } || {};
		
		// Parse new_knowledge array
		const rawKnowledge = Array.isArray(memory.new_knowledge) ? memory.new_knowledge : [];
		const newKnowledge: KnowledgeItem[] = rawKnowledge.map((k: any) => ({
			type: k.type || 'theme',
			value: k.value || k.topic || k.name || String(k)
		}));
		
		// Parse interactions (array of pseudonyms)
		const interactions = Array.isArray(memory.interactions) 
			? memory.interactions.filter((i: any) => typeof i === 'string')
			: [];
		
		// Parse capability_ids
		const capabilityIds = Array.isArray(memory.capability_ids) 
			? memory.capability_ids 
			: [];
		
		return {
			id: memory.id,
			day: metadata.day ?? (memoriesData.length - index),
			identity: memory.identity || null,
			newKnowledge,
			interactions,
			capabilityIds,
			createdAt: memory.created_at,
			envId: memory.env_id,
			envImageUrl: env?.world_image_url || null,
			envVideoUrl: env?.world_video_url || null,
			envTitle: metadata.title || null,
			envDescription: metadata.env_description || null
		};
	});
}

// Fallback: create memory-like entries from envs if attar_memory is empty
async function getMemoriesFromEnvs(): Promise<MemoryEntry[]> {
	const { data: envsData, error } = await supabase
		.from('attar_env')
		.select('*')
		.order('created_at', { ascending: false });
	
	if (error || !envsData) return [];
	
	// Also get backstory for identity fallback
	const { data: backstoryData } = await supabase
		.from('attar_backstory')
		.select('*')
		.order('created_at', { ascending: true });
	
	const backstoryByDay = new Map<number, string>();
	(backstoryData || []).forEach((entry, index) => {
		backstoryByDay.set(index + 1, entry.sentence);
	});
	
	return envsData.map((env, index) => {
		const metadata = env.metadata as { day?: number; title?: string; env_description?: string } || {};
		const day = metadata.day ?? (envsData.length - index);
		
		return {
			id: env.id,
			day,
			identity: backstoryByDay.get(day) || null,
			newKnowledge: [],
			interactions: [],
			capabilityIds: [],
			createdAt: env.created_at,
			envId: env.id,
			envImageUrl: env.world_image_url,
			envVideoUrl: env.world_video_url,
			envTitle: metadata.title || null,
			envDescription: metadata.env_description || null
		};
	});
}

// Get memory count
export async function getMemoryCount(): Promise<number> {
	const { count, error } = await supabase
		.from('attar_memory')
		.select('*', { count: 'exact', head: true });
	
	if (error || count === 0) {
		// Fallback to env count
		const { count: envCount } = await supabase
			.from('attar_env')
			.select('*', { count: 'exact', head: true });
		return envCount || 0;
	}
	
	return count || 0;
}
