import { createBrowserClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	// This ensures the layout re-runs when auth state changes
	depends('supabase:auth');

	// Handle missing env vars gracefully
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		console.error('Missing Supabase environment variables');
		return {
			supabase: null,
			session: null,
			user: null
		};
	}

	try {
		const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: {
				fetch
			}
		});

		// Get fresh session - this uses the cookies set by hooks.server.ts
		const {
			data: { session }
		} = await supabase.auth.getSession();

		return {
			supabase,
			session,
			user: session?.user ?? null
		};
	} catch (e) {
		console.error('Error creating browser Supabase client:', e);
		return {
			supabase: null,
			session: null,
			user: null
		};
	}
};
