import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Check env vars exist
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		console.error('Missing Supabase environment variables');
		// Still set up a dummy getSession so the app doesn't crash
		event.locals.getSession = async () => ({ session: null, user: null });
		return resolve(event);
	}

	try {
		// Create server-side Supabase client with cookie-based session
		event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							event.cookies.set(name, value, { ...options, path: '/' });
						});
					} catch (e) {
						// Ignore cookie setting errors (can happen in some edge cases)
						console.warn('Error setting cookies:', e);
					}
				}
			}
		});

		// This refreshes the session if expired
		event.locals.getSession = async () => {
			try {
				const { data: { session } } = await event.locals.supabase.auth.getSession();
				
				if (!session) {
					return { session: null, user: null };
				}
				
				// Validate the user - this also refreshes expired tokens
				const { data: { user }, error } = await event.locals.supabase.auth.getUser();
				
				if (error || !user) {
					return { session: null, user: null };
				}
				
				return { session, user };
			} catch (e) {
				console.error('Error in getSession:', e);
				return { session: null, user: null };
			}
		};
	} catch (e) {
		console.error('Error creating Supabase client:', e);
		event.locals.getSession = async () => ({ session: null, user: null });
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
