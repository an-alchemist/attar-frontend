import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { SupabaseClient } from '@supabase/supabase-js';

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('Missing Supabase environment variables. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your .env file.');
}

// Singleton client for use in stores (will be set from layout)
let supabaseClient: SupabaseClient | null = null;

export function setSupabaseClient(client: SupabaseClient) {
	supabaseClient = client;
}

export function getSupabaseClient(): SupabaseClient {
	if (!supabaseClient) {
		// Fallback: create a new client if not set (shouldn't happen in normal flow)
		supabaseClient = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	}
	return supabaseClient;
}

// For backward compatibility - returns the client
export const supabase = {
	get client() {
		return getSupabaseClient();
	},
	// Proxy all methods to the actual client
	get auth() {
		return getSupabaseClient().auth;
	},
	get storage() {
		return getSupabaseClient().storage;
	},
	from(table: string) {
		return getSupabaseClient().from(table);
	},
	rpc(fn: string, params?: any) {
		return getSupabaseClient().rpc(fn, params);
	}
};

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
