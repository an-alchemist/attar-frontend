<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import ProfileSettings from '$lib/components/ProfileSettings.svelte';
	import { initAuth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { children } = $props();
	let showAuthModal = $state(false);
	let showSettings = $state(false);

	const hiddenHeaderRoutes = ['/mailbox', '/timeline', '/memories'];
	const shouldHideHeader = $derived(
		hiddenHeaderRoutes.some(route => $page.url.pathname.startsWith(route))
	);

	onMount(() => {
		return initAuth();
	});
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
