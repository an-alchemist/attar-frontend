import { createBrowserClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	// This ensures the layout re-runs when auth state changes
	depends('supabase:auth');

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		},
		cookies: {
			// Let the browser handle cookies automatically
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
};

