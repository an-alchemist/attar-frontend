import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { browser } from '$app/environment';

// Types for our tables
export type AttarProfile = {
	id: string;
	user_id: string;
	pseudoname: string;
	avatar_url: string | null;
	available_moons: number;
	receive_letters: boolean;
	last_moon_refresh: string;
	created_at: string;
	updated_at: string;
};

export type AttarMailbox = {
	id: string;
	user_id: string;
	subject: string;
	content: string;
	received_moons: number;
	published: boolean;
	created_at: string;
	updated_at: string;
};

export type AttarVote = {
	id: string;
	user_id: string;
	votable_type: 'letter' | 'env_decision';
	votable_id: string;
	choice_index: number | null;
	moon_amount: number;
	created_at: string;
};

export type AttarBackstory = {
	id: string;
	sentence: string;
	reasoning: string | null;
	created_at: string;
};

export type AttarEnvChoice = {
	title: string;
	description: string;
	vote_count: number;
};

export type AttarEnv = {
	id: string;
	entity_image_url: string | null;
	world_image_url: string | null;
	world_video_url: string | null;
	decisions: {
		choices: AttarEnvChoice[];
	};
	created_at: string;
	updated_at: string;
};

export type AttarMemory = {
	id: string;
	identity: string | null;
	new_knowledge: any[];
	interactions: any[];
	env_id: string | null;
	capability_ids: string[];
	created_at: string;
};

export type AttarCapability = {
	id: string;
	name: string;
	description: string | null;
	unlocked_at: string;
	created_at: string;
};

// Create client - singleton
let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
	if (!_supabase) {
		_supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	}
	return _supabase;
}

// Proxy that lazily creates client
export const supabase = {
	get auth() {
		return getClient().auth;
	},
	get storage() {
		return getClient().storage;
	},
	from(table: string) {
		return getClient().from(table);
	},
	rpc(fn: string, params?: any) {
		return getClient().rpc(fn, params);
	}
};
