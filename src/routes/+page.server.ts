import { supabase } from '$lib/supabase';

export async function load() {
	// Fetch latest environment for OG image
	const { data: latestEnv } = await supabase
		.from('attar_env')
		.select('world_image_url, metadata')
		.order('created_at', { ascending: false })
		.limit(1)
		.single();
	
	// Fetch latest backstory for description
	const { data: latestBackstory } = await supabase
		.from('attar_backstory')
		.select('sentence')
		.order('created_at', { ascending: false })
		.limit(1)
		.single();
	
	const metadata = latestEnv?.metadata as { title?: string; day?: number } || {};
	
	return {
		ogImage: latestEnv?.world_image_url || '/og-image.png',
		ogTitle: metadata.title ? `Attar - ${metadata.title}` : 'Attar',
		ogDescription: latestBackstory?.sentence || 'An evolving digital consciousness shaped by collective choices.',
		currentDay: metadata.day || 1
	};
}
