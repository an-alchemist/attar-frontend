import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Create server-side Supabase client with cookie-based session
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// This refreshes the session if expired - critical for keeping auth working!
	// getUser() validates the JWT and refreshes if needed
	event.locals.getSession = async () => {
		const { data: { session } } = await event.locals.supabase.auth.getSession();
		
		if (!session) {
			return { session: null, user: null };
		}
		
		// Validate the user - this also refreshes expired tokens
		const { data: { user }, error } = await event.locals.supabase.auth.getUser();
		
		if (error || !user) {
			// Invalid session, clear it
			return { session: null, user: null };
		}
		
		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Allow Supabase auth cookies through
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

