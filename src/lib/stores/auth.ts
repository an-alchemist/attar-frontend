// Re-export from state for backwards compatibility
// Components can import from here or from state.svelte.ts
import { authState, setAuth, setProfile, isAuthenticated as checkAuth, updateMoons } from '$lib/state.svelte';
import { supabase, type AttarProfile } from '$lib/supabase';
import { writable, derived, get } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';

// Svelte stores that sync with state (for components using stores)
export const user = {
	subscribe: (fn: (value: User | null) => void) => {
		fn(authState.user);
		return () => {};
	},
	set: (value: User | null) => { authState.user = value; }
};

export const session = {
	subscribe: (fn: (value: Session | null) => void) => {
		fn(authState.session);
		return () => {};
	},
	set: (value: Session | null) => { authState.session = value; }
};

export const profile = {
	subscribe: (fn: (value: AttarProfile | null) => void) => {
		fn(authState.profile);
		return () => {};
	},
	set: (value: AttarProfile | null) => { authState.profile = value; },
	update: (fn: (value: AttarProfile | null) => AttarProfile | null) => {
		authState.profile = fn(authState.profile);
	}
};

export const loading = {
	subscribe: (fn: (value: boolean) => void) => {
		fn(authState.loading);
		return () => {};
	},
	set: (value: boolean) => { authState.loading = value; }
};

export const authError = {
	subscribe: (fn: (value: string | null) => void) => {
		fn(authState.error);
		return () => {};
	},
	set: (value: string | null) => { authState.error = value; }
};

export const isAuthenticated = {
	subscribe: (fn: (value: boolean) => void) => {
		fn(!!authState.user);
		return () => {};
	}
};

// Initialize auth - called from layout
export async function initAuth() {
	authState.loading = true;
	authState.error = null;

	try {
		if (authState.user) {
			await fetchProfile(authState.user.id);
		}
	} catch (e) {
		console.error('Auth init error:', e);
		authState.error = e instanceof Error ? e.message : 'Failed to initialize auth';
	} finally {
		authState.loading = false;
	}
}

// Refresh profile
export async function refreshProfile() {
	if (authState.user) {
		await fetchProfile(authState.user.id);
	}
}

// Fetch profile
async function fetchProfile(userId: string) {
	try {
		let { data, error } = await supabase
			.from('attar_profile')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (error && error.code === 'PGRST116') {
			// Create profile
			const { data: newProfile, error: createError } = await supabase
				.from('attar_profile')
				.insert({
					user_id: userId,
					pseudoname: 'Anonymous',
					available_moons: 13,
					receive_letters: true
				})
				.select()
				.single();

			if (createError) {
				console.error('Error creating profile:', createError);
				return;
			}
			data = newProfile;
		} else if (error) {
			console.error('Error fetching profile:', error);
			return;
		}

		setProfile(data);
	} catch (e) {
		console.error('Profile fetch error:', e);
	}
}

// Auth functions
export async function signUp(email: string, password: string, pseudoname?: string) {
	authState.loading = true;
	authState.error = null;

	try {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { pseudoname: pseudoname || 'Anonymous' }
			}
		});

		if (error) {
			authState.error = error.message;
			throw error;
		}

		if (data.user && !data.session) {
			return { user: data.user, session: null, confirmEmail: true };
		}

		return { user: data.user, session: data.session, confirmEmail: false };
	} finally {
		authState.loading = false;
	}
}

export async function signIn(email: string, password: string) {
	authState.loading = true;
	authState.error = null;

	try {
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			authState.error = error.message;
			throw error;
		}

		return data;
	} finally {
		authState.loading = false;
	}
}

export async function signInWithGoogle() {
	authState.loading = true;
	authState.error = null;

	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});

		if (error) {
			authState.error = error.message;
			throw error;
		}

		return data;
	} finally {
		authState.loading = false;
	}
}

export async function signInWithTwitter() {
	authState.loading = true;
	authState.error = null;

	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'twitter',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});

		if (error) {
			authState.error = error.message;
			throw error;
		}

		return data;
	} finally {
		authState.loading = false;
	}
}

export async function signOut() {
	authState.loading = true;
	authState.error = null;

	try {
		const { error } = await supabase.auth.signOut();

		if (error) {
			authState.error = error.message;
			throw error;
		}

		setAuth(null, null);
		setProfile(null);
	} finally {
		authState.loading = false;
	}
}

export async function updateProfile(updates: Partial<Pick<AttarProfile, 'pseudoname' | 'avatar_url' | 'receive_letters'>>) {
	if (!authState.user) throw new Error('Not authenticated');

	const { data, error } = await supabase
		.from('attar_profile')
		.update({ ...updates, updated_at: new Date().toISOString() })
		.eq('user_id', authState.user.id)
		.select()
		.single();

	if (error) throw error;

	setProfile(data);
	return data;
}

export async function uploadAvatar(file: File) {
	if (!authState.user) throw new Error('Not authenticated');

	const fileExt = file.name.split('.').pop();
	const fileName = `${authState.user.id}/avatar-${Date.now()}.${fileExt}`;

	const { error: uploadError } = await supabase.storage
		.from('attar-avatars')
		.upload(fileName, file, { upsert: true });

	if (uploadError) throw uploadError;

	const { data: { publicUrl } } = supabase.storage
		.from('attar-avatars')
		.getPublicUrl(fileName);

	await updateProfile({ avatar_url: publicUrl });

	return publicUrl;
}
