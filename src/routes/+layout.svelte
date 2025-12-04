<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import ProfileSettings from '$lib/components/ProfileSettings.svelte';
	import { initAuth, session as sessionStore, user as userStore } from '$lib/stores/auth';
	import { setSupabaseClient } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';

	let { children, data } = $props();
	let showAuthModal = $state(false);
	let showSettings = $state(false);

	// Routes where the header should be hidden (expanded view pages)
	const hiddenHeaderRoutes = ['/mailbox', '/timeline', '/memories'];
	
	// Check if current route should hide the header
	const shouldHideHeader = $derived(
		hiddenHeaderRoutes.some(route => $page.url.pathname.startsWith(route))
	);

	onMount(() => {
		// Set the supabase client from layout data (created fresh each page load)
		setSupabaseClient(data.supabase);
		
		// Initialize auth with the session from server
		if (data.session) {
			sessionStore.set(data.session);
			userStore.set(data.session.user);
		}
		
		// Initialize auth (will fetch profile, set up listeners)
		initAuth();
		
		// Listen for auth state changes and invalidate to refresh server data
		const { data: { subscription } } = data.supabase.auth.onAuthStateChange((event, newSession) => {
			// Update stores immediately
			sessionStore.set(newSession);
			userStore.set(newSession?.user ?? null);
			
			// Invalidate to re-run server load and get fresh session in cookies
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	function openAuth() {
		showAuthModal = true;
	}

	function closeAuth() {
		showAuthModal = false;
	}

	function openSettings() {
		showSettings = true;
	}

	function closeSettings() {
		showSettings = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="relative w-full h-screen overflow-hidden">
	{#if !shouldHideHeader}
		<Header onAuthClick={openAuth} onSettingsClick={openSettings} />
	{/if}
	<main class="w-full h-full overflow-hidden">
		{@render children()}
	</main>
</div>

{#if showAuthModal}
	<AuthModal onClose={closeAuth} />
{/if}

{#if showSettings}
	<ProfileSettings onClose={closeSettings} />
{/if}
