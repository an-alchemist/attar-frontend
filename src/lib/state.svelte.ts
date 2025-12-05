// Global reactive state using Svelte 5 runes
// This state persists across navigations and is shared by all components

import type { AttarProfile, AttarEnv, AttarBackstory, AttarMailbox, AttarMemory } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// App data state - loaded once, updated as needed
export const appData = $state({
	// Environment
	currentEnv: null as {
		id: string;
		title: string;
		day: number;
		worldImageUrl: string | null;
		worldVideoUrl: string | null;
		entityImageUrl: string | null;
		choices: Array<{
			id: string;
			title: string;
			description: string;
			votes: number;
		}>;
	} | null,
	
	// Backstory
	latestBackstory: null as {
		day: number;
		text: string;
		reasoning: string | null;
	} | null,
	
	// Timeline entries
	timeline: [] as Array<{
		id: string;
		day: number;
		title: string;
		worldImageUrl: string | null;
		worldVideoUrl: string | null;
		entityImageUrl: string | null;
	}>,
	
	// Letters
	letters: [] as AttarMailbox[],
	
	// Memories
	memories: [] as Array<{
		id: string;
		day: number;
		identity: string | null;
		themes: string[];
		ideas: string[];
		envImageUrl: string | null;
		envVideoUrl: string | null;
	}>,
	
	// Load state
	loaded: false,
	loading: false,
	error: null as string | null
});

// Auth state - separate for clarity
export const authState = $state({
	user: null as User | null,
	session: null as Session | null,
	profile: null as AttarProfile | null,
	loading: true,
	error: null as string | null
});

// Derived values
export function isAuthenticated() {
	return !!authState.user;
}

export function availableMoons() {
	return authState.profile?.available_moons ?? 0;
}

// Update auth state
export function setAuth(user: User | null, session: Session | null) {
	authState.user = user;
	authState.session = session;
	authState.loading = false;
}

export function setProfile(profile: AttarProfile | null) {
	authState.profile = profile;
}

export function updateMoons(amount: number) {
	if (authState.profile) {
		authState.profile.available_moons += amount;
	}
}

// Update app data
export function setAppData(data: {
	currentEnv?: typeof appData.currentEnv;
	latestBackstory?: typeof appData.latestBackstory;
	timeline?: typeof appData.timeline;
	letters?: typeof appData.letters;
	memories?: typeof appData.memories;
}) {
	if (data.currentEnv !== undefined) appData.currentEnv = data.currentEnv;
	if (data.latestBackstory !== undefined) appData.latestBackstory = data.latestBackstory;
	if (data.timeline !== undefined) appData.timeline = data.timeline;
	if (data.letters !== undefined) appData.letters = data.letters;
	if (data.memories !== undefined) appData.memories = data.memories;
	appData.loaded = true;
	appData.loading = false;
}

// Update vote count locally (optimistic update)
export function updateVoteCount(choiceIndex: number, amount: number) {
	if (appData.currentEnv && appData.currentEnv.choices[choiceIndex]) {
		appData.currentEnv.choices[choiceIndex].votes += amount;
	}
}

// Update letter moons locally
export function updateLetterMoons(letterId: string, amount: number) {
	const letter = appData.letters.find(l => l.id === letterId);
	if (letter) {
		letter.received_moons += amount;
	}
}

