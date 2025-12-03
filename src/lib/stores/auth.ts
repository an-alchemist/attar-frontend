import { writable, derived, get } from 'svelte/store';
import { supabase, type AttarProfile } from '$lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Auth state stores
export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const profile = writable<AttarProfile | null>(null);
export const loading = writable(true);
export const authError = writable<string | null>(null);

// Derived state
export const isAuthenticated = derived(user, ($user) => !!$user);

// Initialize auth - call this once in layout
export async function initAuth() {
	loading.set(true);
	authError.set(null);
	
	try {
		// Get initial session from storage
		const { data: { session: initialSession }, error } = await supabase.auth.getSession();
		
		if (error) {
			console.error('Error getting session:', error);
			authError.set(error.message);
		}
		
		if (initialSession) {
			session.set(initialSession);
			user.set(initialSession.user);
			await fetchProfile(initialSession.user.id);
		}
		
		// Listen for auth state changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, newSession) => {
				console.log('Auth event:', event);
				
				session.set(newSession);
				user.set(newSession?.user ?? null);
				
				if (event === 'SIGNED_IN' && newSession?.user) {
					await fetchProfile(newSession.user.id);
				} else if (event === 'SIGNED_OUT') {
					profile.set(null);
				} else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
					// Session refreshed, ensure profile is loaded
					const currentProfile = get(profile);
					if (!currentProfile) {
						await fetchProfile(newSession.user.id);
					}
				}
			}
		);
		
		// Return unsubscribe function for cleanup
		return () => {
			subscription.unsubscribe();
		};
	} catch (e) {
		console.error('Auth init error:', e);
		authError.set(e instanceof Error ? e.message : 'Failed to initialize auth');
	} finally {
		loading.set(false);
	}
}

// Refresh profile (public function)
export async function refreshProfile() {
	const currentUser = get(user);
	if (currentUser) {
		await fetchProfile(currentUser.id);
	}
}

// Fetch user profile (create if doesn't exist)
async function fetchProfile(userId: string) {
	try {
		// Try to get existing profile
		let { data, error } = await supabase
			.from('attar_profile')
			.select('*')
			.eq('user_id', userId)
			.single();
		
		// If profile doesn't exist (PGRST116 = no rows), create it
		if (error && error.code === 'PGRST116') {
			console.log('Profile not found, creating new profile...');
			
			// Get pseudoname from user metadata (set during signup)
			const { data: { user: currentUser } } = await supabase.auth.getUser();
			const metaPseudoName = currentUser?.user_metadata?.pseudoname;
			const pseudoname = metaPseudoName && metaPseudoName.trim() ? metaPseudoName.trim() : 'Anonymous';
			
			const { data: newProfile, error: createError } = await supabase
				.from('attar_profile')
				.insert({
					user_id: userId,
					pseudoname: pseudoname,
					available_moons: 13,
					receive_letters: true
				})
				.select()
				.single();
			
			if (createError) {
				console.error('Error creating profile:', createError);
				authError.set('Failed to create profile');
				return;
			}
			
			data = newProfile;
		} else if (error) {
			console.error('Error fetching profile:', error);
			authError.set('Failed to fetch profile');
			return;
		}
		
		profile.set(data);
		authError.set(null);
	} catch (e) {
		console.error('Profile fetch error:', e);
		authError.set(e instanceof Error ? e.message : 'Profile error');
	}
}

// Sign up with email and password
export async function signUp(email: string, password: string, pseudoname?: string) {
	loading.set(true);
	authError.set(null);
	
	try {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					pseudoname: pseudoname || 'Anonymous'
				}
			}
		});
		
		if (error) {
			authError.set(error.message);
			throw error;
		}
		
		// Check if email confirmation is required
		if (data.user && !data.session) {
			return { 
				user: data.user, 
				session: null,
				confirmEmail: true 
			};
		}
		
		return { 
			user: data.user, 
			session: data.session,
			confirmEmail: false 
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Sign up failed';
		authError.set(message);
		throw e;
	} finally {
		loading.set(false);
	}
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
	loading.set(true);
	authError.set(null);
	
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		
		if (error) {
			authError.set(error.message);
			throw error;
		}
		
		return data;
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Sign in failed';
		authError.set(message);
		throw e;
	} finally {
		loading.set(false);
	}
}

// Sign in with Google OAuth
export async function signInWithGoogle() {
	loading.set(true);
	authError.set(null);
	
	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/`
			}
		});
		
		if (error) {
			authError.set(error.message);
			throw error;
		}
		
		return data;
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Google sign in failed';
		authError.set(message);
		throw e;
	} finally {
		loading.set(false);
	}
}

// Sign in with X (Twitter) OAuth
export async function signInWithTwitter() {
	loading.set(true);
	authError.set(null);
	
	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'twitter',
			options: {
				redirectTo: `${window.location.origin}/`
			}
		});
		
		if (error) {
			authError.set(error.message);
			throw error;
		}
		
		return data;
	} catch (e) {
		const message = e instanceof Error ? e.message : 'X sign in failed';
		authError.set(message);
		throw e;
	} finally {
		loading.set(false);
	}
}

// Sign out
export async function signOut() {
	loading.set(true);
	authError.set(null);
	
	try {
		const { error } = await supabase.auth.signOut();
		
		if (error) {
			authError.set(error.message);
			throw error;
		}
		
		// Clear all stores
		user.set(null);
		session.set(null);
		profile.set(null);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Sign out failed';
		authError.set(message);
		throw e;
	} finally {
		loading.set(false);
	}
}

// Update profile
export async function updateProfile(updates: Partial<Pick<AttarProfile, 'pseudoname' | 'avatar_url' | 'receive_letters'>>) {
	const currentUser = get(user);
	if (!currentUser) throw new Error('Not authenticated');
	
	try {
		const { data, error } = await supabase
			.from('attar_profile')
			.update({
				...updates,
				updated_at: new Date().toISOString()
			})
			.eq('user_id', currentUser.id)
			.select()
			.single();
		
		if (error) throw error;
		
		profile.set(data);
		return data;
	} catch (e) {
		console.error('Update profile error:', e);
		throw e;
	}
}

// Upload avatar
export async function uploadAvatar(file: File) {
	const currentUser = get(user);
	if (!currentUser) throw new Error('Not authenticated');
	
	const fileExt = file.name.split('.').pop();
	const fileName = `${currentUser.id}/avatar-${Date.now()}.${fileExt}`;
	
	try {
		// Upload file
		const { error: uploadError } = await supabase.storage
			.from('attar-avatars')
			.upload(fileName, file, { upsert: true });
		
		if (uploadError) throw uploadError;
		
		// Get public URL
		const { data: { publicUrl } } = supabase.storage
			.from('attar-avatars')
			.getPublicUrl(fileName);
		
		// Update profile with new avatar URL
		await updateProfile({ avatar_url: publicUrl });
		
		return publicUrl;
	} catch (e) {
		console.error('Avatar upload error:', e);
		throw e;
	}
}
