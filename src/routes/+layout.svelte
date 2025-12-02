<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import ProfileSettings from '$lib/components/ProfileSettings.svelte';
	import { initAuth, isAuthenticated } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { children } = $props();
	let showAuthModal = $state(false);
	let showSettings = $state(false);

	// Routes where the header should be hidden (expanded view pages)
	const hiddenHeaderRoutes = ['/mailbox', '/timeline', '/memories'];
	
	// Check if current route should hide the header
	const shouldHideHeader = $derived(
		hiddenHeaderRoutes.some(route => $page.url.pathname.startsWith(route))
	);

	onMount(() => {
		initAuth();
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
