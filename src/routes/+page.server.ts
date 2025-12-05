import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Use server supabase client from hooks
	const { supabase } = locals;
	
	// Fetch both in parallel
	const [envResult, backstoryResult] = await Promise.all([
		supabase
			.from('attar_env')
			.select('id, entity_image_url, world_image_url, world_video_url, decisions, metadata, created_at')
			.order('created_at', { ascending: false })
			.limit(1)
			.single(),
		supabase
			.from('attar_backstory')
			.select('sentence')
			.order('created_at', { ascending: false })
			.limit(1)
			.single()
	]);
	
	const latestEnv = envResult.data;
	const latestBackstory = backstoryResult.data;
	const metadata = (latestEnv?.metadata as { title?: string; day?: number }) || {};
	
	// Build OG image URL
	let ogImage = latestEnv?.world_image_url || 'https://attarglitch.com/worlds/be.png';
	if (ogImage && !ogImage.startsWith('http')) {
		ogImage = `https://attarglitch.com${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
	}
	
	// Transform env data for frontend
	const currentEnv = latestEnv ? {
		id: latestEnv.id,
		title: metadata.title || 'Untitled',
		day: metadata.day || 1,
		worldImageUrl: latestEnv.world_image_url,
		worldVideoUrl: latestEnv.world_video_url,
		entityImageUrl: latestEnv.entity_image_url,
		choices: (latestEnv.decisions?.choices || []).map((c: any, i: number) => ({
			id: `choice-${i}`,
			title: c.title || `Choice ${i + 1}`,
			description: c.description || '',
			votes: c.vote_count || 0
		}))
	} : null;
	
	const backstory = latestBackstory ? {
		day: metadata.day || 1,
		text: latestBackstory.sentence,
		reasoning: null
	} : null;
	
	return {
		// For OG tags
		ogImage,
		ogTitle: metadata.title ? `Attar - ${metadata.title}` : 'Attar - An Evolving Entity',
		ogDescription: latestBackstory?.sentence || 'A collaborative experiment where collective choices shape the evolution of a digital being.',
		// For page
		currentEnv,
		latestBackstory: backstory
	};
};
