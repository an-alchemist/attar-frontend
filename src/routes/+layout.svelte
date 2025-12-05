<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import ProfileSettings from '$lib/components/ProfileSettings.svelte';
	import { authState, setAuth, setProfile, isAuthenticated } from '$lib/state.svelte';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';

	let { children, data } = $props();
	let showAuthModal = $state(false);
	let showSettings = $state(false);

	// Routes where header is hidden
	const hiddenHeaderRoutes = ['/mailbox', '/timeline', '/memories'];
	const shouldHideHeader = $derived(
		hiddenHeaderRoutes.some(route => $page.url.pathname.startsWith(route))
	);

	onMount(() => {
		// Set initial auth state from server
		setAuth(data.user, data.session);
		
		// Fetch profile if logged in
		if (data.user) {
			fetchProfile(data.user.id);
		}
		
		// Listen for auth changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				// Update local state immediately
				setAuth(session?.user ?? null, session);
				
				if (event === 'SIGNED_IN' && session?.user) {
					await fetchProfile(session.user.id);
				} else if (event === 'SIGNED_OUT') {
					setProfile(null);
				}
				
				// Invalidate server data on auth changes
				if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
					invalidate('supabase:auth');
				}
			}
		);

		return () => subscription.unsubscribe();
	});
	
	async function fetchProfile(userId: string) {
		const { data: profile, error } = await supabase
			.from('attar_profile')
			.select('*')
			.eq('user_id', userId)
			.single();
		
		if (error && error.code === 'PGRST116') {
			// Create profile if doesn't exist
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
			
			setProfile(newProfile);
		} else if (!error) {
			setProfile(profile);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="relative w-full h-screen overflow-hidden">
	{#if !shouldHideHeader}
		<Header onAuthClick={() => showAuthModal = true} onSettingsClick={() => showSettings = true} />
	{/if}
	<main class="w-full h-full overflow-hidden">
		{@render children()}
	</main>
</div>

{#if showAuthModal}
	<AuthModal onClose={() => showAuthModal = false} />
{/if}

{#if showSettings}
	<ProfileSettings onClose={() => showSettings = false} />
{/if}
