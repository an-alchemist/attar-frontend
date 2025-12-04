import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Safety check - getSession might not exist if hooks.server.ts failed
	if (!locals.getSession) {
		console.error('getSession not available on locals');
		return {
			session: null,
			user: null
		};
	}
	
	try {
		const { session, user } = await locals.getSession();
		return {
			session,
			user
		};
	} catch (e) {
		console.error('Error getting session:', e);
		return {
			session: null,
			user: null
		};
	}
};
