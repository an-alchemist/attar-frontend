import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { SupabaseClient } from '@supabase/supabase-js';

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

// Browser client - created ONCE and reused
let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient() {
	if (browserClient) return browserClient;
	
	browserClient = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	return browserClient;
}

// For server-side - create fresh client per request with cookies
export function createServerSupabaseClient(cookies: {
	getAll: () => { name: string; value: string }[];
	setAll: (cookies: { name: string; value: string; options: any }[]) => void;
}) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies
	});
}

// Get the appropriate client based on environment
export function getSupabaseClient(): SupabaseClient {
	if (isBrowser()) {
		return createBrowserSupabaseClient();
	}
	throw new Error('Cannot use getSupabaseClient on server - use createServerSupabaseClient with cookies');
}

// Shorthand for browser usage - ensures single instance
export const supabase = {
	get auth() {
		return createBrowserSupabaseClient().auth;
	},
	get storage() {
		return createBrowserSupabaseClient().storage;
	},
	from(table: string) {
		return createBrowserSupabaseClient().from(table);
	},
	rpc(fn: string, params?: any) {
		return createBrowserSupabaseClient().rpc(fn, params);
	}
};
