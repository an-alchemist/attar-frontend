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
	
	// Ensure OG image is absolute URL
	let ogImage = latestEnv?.world_image_url || 'https://attar.day/worlds/be.png';
	if (ogImage && !ogImage.startsWith('http')) {
		ogImage = `https://attar.day${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
	}
	
	return {
		ogImage,
		ogTitle: metadata.title ? `Attar - ${metadata.title}` : 'Attar - An Evolving Entity',
		ogDescription: latestBackstory?.sentence || 'A collaborative experiment where collective choices shape the evolution of a digital being.',
		currentDay: metadata.day || 1
	};
}
