import { supabase, type AttarProfile } from '$lib/supabase';
import { writable, derived } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';

// Stores
export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const profile = writable<AttarProfile | null>(null);
export const loading = writable(true);
export const authError = writable<string | null>(null);

export const isAuthenticated = derived(user, ($user) => !!$user);

// Initialize auth
export function initAuth() {
	loading.set(true);
	
	// Get initial session
	supabase.auth.getSession().then(({ data: { session: s } }) => {
		session.set(s);
		user.set(s?.user ?? null);
		if (s?.user) {
			fetchProfile(s.user.id);
		}
		loading.set(false);
	});

	// Listen for auth changes
	const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
		session.set(s);
		user.set(s?.user ?? null);
		if (s?.user) {
			fetchProfile(s.user.id);
		} else {
			profile.set(null);
		}
	});

	return () => subscription.unsubscribe();
}

// Fetch profile
async function fetchProfile(userId: string) {
	let { data, error } = await supabase
		.from('attar_profile')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error && error.code === 'PGRST116') {
		const { data: newProfile } = await supabase
			.from('attar_profile')
			.insert({
				user_id: userId,
				pseudoname: 'Anonymous',
				available_moons: 13,
				receive_letters: true
			})
			.select()
			.single();
		data = newProfile;
	}

	if (data) profile.set(data);
}

// Refresh profile
export async function refreshProfile() {
	const u = await new Promise<User | null>(resolve => {
		const unsub = user.subscribe(v => { resolve(v); unsub(); });
	});
	if (u) await fetchProfile(u.id);
}

// Sign up
export async function signUp(email: string, password: string, pseudoname?: string) {
	loading.set(true);
	authError.set(null);

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: { data: { pseudoname: pseudoname || 'Anonymous' } }
	});

	loading.set(false);

	if (error) {
		authError.set(error.message);
		throw error;
	}

	return { user: data.user, session: data.session, confirmEmail: !data.session };
}

// Sign in
export async function signIn(email: string, password: string) {
	loading.set(true);
	authError.set(null);

	const { data, error } = await supabase.auth.signInWithPassword({ email, password });

	loading.set(false);

	if (error) {
		authError.set(error.message);
		throw error;
	}

	return data;
}

// Google
export async function signInWithGoogle() {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo: `${window.location.origin}/auth/callback` }
	});

	if (error) {
		authError.set(error.message);
		throw error;
	}

	return data;
}

// Twitter
export async function signInWithTwitter() {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'twitter',
		options: { redirectTo: `${window.location.origin}/auth/callback` }
	});

	if (error) {
		authError.set(error.message);
		throw error;
	}

	return data;
}

// Sign out
export async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) {
		authError.set(error.message);
		throw error;
	}
	user.set(null);
	session.set(null);
	profile.set(null);
}

// Update profile
export async function updateProfile(updates: Partial<Pick<AttarProfile, 'pseudoname' | 'avatar_url' | 'receive_letters'>>) {
	const u = await new Promise<User | null>(resolve => {
		const unsub = user.subscribe(v => { resolve(v); unsub(); });
	});
	if (!u) throw new Error('Not authenticated');

	const { data, error } = await supabase
		.from('attar_profile')
		.update({ ...updates, updated_at: new Date().toISOString() })
		.eq('user_id', u.id)
		.select()
		.single();

	if (error) throw error;
	profile.set(data);
	return data;
}

// Upload avatar
export async function uploadAvatar(file: File) {
	const u = await new Promise<User | null>(resolve => {
		const unsub = user.subscribe(v => { resolve(v); unsub(); });
	});
	if (!u) throw new Error('Not authenticated');

	const fileExt = file.name.split('.').pop();
	const fileName = `${u.id}/avatar-${Date.now()}.${fileExt}`;

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
