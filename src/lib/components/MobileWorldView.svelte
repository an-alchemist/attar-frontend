<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import WorldCard from './WorldCard.svelte';
	import type { CurrentEnv } from '$lib/stores/env';
	import type { BackstoryEntry } from '$lib/stores/backstory';
	
	type Props = {
		currentEnv: CurrentEnv;
		latestBackstory: BackstoryEntry | null;
	};
	
	let { currentEnv, latestBackstory }: Props = $props();
	
	let activeTab = $state<'world' | 'backstory' | 'mailbox' | 'memory' | 'timeline'>('world');
	
	// Removed 'Story' tab since it has no destination yet
	const tabs = [
		{ id: 'mailbox' as const, icon: '✉', label: 'Mail' },
		{ id: 'world' as const, icon: '◆', label: 'Today' },
		{ id: 'memory' as const, icon: '⬡', label: 'Memory' },
		{ id: 'timeline' as const, icon: '↓', label: 'Time' }
	];
	
	function handleTabClick(tabId: typeof activeTab) {
		if (tabId === 'world') {
			activeTab = 'world';
			return;
		}
		
		// Navigate to full page for other tabs
		switch (tabId) {
			case 'mailbox':
				goto('/mailbox');
				break;
			case 'memory':
				goto('/memories');
				break;
			case 'timeline':
				goto('/timeline');
				break;
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="mobile-container">
	<!-- Background pattern -->
	<div class="bg-pattern"></div>
	
	<!-- Main content area -->
	<div class="content-area">
		{#if activeTab === 'world'}
			<div class="world-wrapper">
				<WorldCard 
					title={currentEnv.title}
					image={currentEnv.worldVideoUrl || currentEnv.worldImageUrl || '/worlds/be.png'}
					choices={currentEnv.choices}
					day={currentEnv.day}
					backstoryLine={latestBackstory?.text || ''}
					envId={currentEnv.id}
				/>
			</div>
		{/if}
	</div>
	
	<!-- Bottom navigation tabs -->
	<nav class="bottom-tabs">
		{#each tabs as tab (tab.id)}
			<button 
				class="tab-btn"
				class:active={activeTab === tab.id}
				onclick={() => handleTabClick(tab.id)}
			>
				<span class="tab-icon">{tab.icon}</span>
				<span class="tab-label">{tab.label}</span>
			</button>
		{/each}
	</nav>
</div>

<style>
	.mobile-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #0a0a0c;
		font-family: 'JetBrains Mono', monospace;
		overflow: hidden;
	}
	
	.bg-pattern {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
		background-size: 16px 16px;
	}
	
	.content-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px;
		padding-top: 72px; /* Space for header */
		padding-bottom: 88px; /* Space for bottom tabs */
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}
	
	.world-wrapper {
		width: 100%;
		max-width: 480px;
		display: flex;
		flex-direction: column;
		/* Allow content to expand and be scrollable */
		flex-shrink: 0;
	}
	
	/* Bottom navigation */
	.bottom-tabs {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		align-items: center;
		height: 72px;
		padding: 8px 12px;
		padding-bottom: max(8px, env(safe-area-inset-bottom));
		background: linear-gradient(180deg, rgba(20, 18, 25, 0.95) 0%, rgba(15, 13, 20, 0.98) 100%);
		border-top: 1px solid rgba(120, 110, 130, 0.3);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		z-index: 100;
	}
	
	.tab-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 4px;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
		min-height: 56px;
	}
	
	.tab-btn:active {
		transform: scale(0.95);
	}
	
	.tab-icon {
		font-size: 20px;
		color: rgba(200, 230, 180, 0.4);
		transition: all 0.2s ease;
	}
	
	.tab-label {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		transition: all 0.2s ease;
	}
	
	.tab-btn.active .tab-icon {
		color: rgba(200, 230, 180, 0.95);
		transform: scale(1.1);
		text-shadow: 0 0 12px rgba(200, 230, 180, 0.5);
	}
	
	.tab-btn.active .tab-label {
		color: rgba(200, 230, 180, 0.9);
	}
	
	/* Ensure touch targets are at least 44x44 */
	.tab-btn {
		min-width: 44px;
		min-height: 44px;
	}
</style>

