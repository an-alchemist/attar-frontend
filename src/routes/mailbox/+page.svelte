<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getPublishedLetters, voteOnLetter } from '$lib/stores/mailbox';
	import { profile } from '$lib/stores/auth';
	import type { AttarMailbox } from '$lib/supabase';
	import MoonVoter from '$lib/components/MoonVoter.svelte';
	
	let letters = $state<AttarMailbox[]>([]);
	let loading = $state(true);
	let selectedId = $state<string | null>(null);
	let showSidebar = $state(true);
	
	const selectedLetter = $derived(letters.find(l => l.id === selectedId) || null);
	
	onMount(async () => {
		letters = await getPublishedLetters(50);
		loading = false;
		// Auto-select first letter if available
		if (letters.length > 0) {
			selectedId = letters[0].id;
		}
	});
	
	function goBack() {
		goto('/');
	}
	
	function goToWrite() {
		goto('/write');
	}
	
	function selectLetter(letter: AttarMailbox) {
		selectedId = letter.id;
		// On mobile, hide sidebar after selection
		if (window.innerWidth < 768) {
			showSidebar = false;
		}
	}
	
	function toggleSidebar() {
		showSidebar = !showSidebar;
	}
	
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);
		
		if (diffHours < 1) return 'just now';
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}
	
	async function handleVote(amount: number) {
		if (!selectedLetter) return { success: false, error: 'No letter selected' };
		
		const result = await voteOnLetter(selectedLetter.id, amount);
		
		if (result.success) {
			// Update local letter data
			letters = letters.map(l => 
				l.id === selectedLetter.id 
					? { ...l, received_moons: l.received_moons + amount }
					: l
			);
		}
		
		return result;
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			goBack();
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
	<title>Mailbox - Attar</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="page-container" style="font-family: 'JetBrains Mono', monospace;">
	<!-- Fixed top bar with back button -->
	<div class="top-bar">
		<div class="top-bar-left">
			<button onclick={goBack} class="back-btn">
				← Back
			</button>
			<button onclick={toggleSidebar} class="toggle-btn" class:active={showSidebar}>
				☰
			</button>
			<div class="title-section">
				<span class="title">Mailbox.exe</span>
				<span class="subtitle">{letters.length} letters</span>
			</div>
		</div>
		<div class="top-bar-right">
			{#if $profile}
				<span class="moon-balance">🌙 {$profile.available_moons}</span>
			{/if}
			<button onclick={goToWrite} class="write-btn">
				✉ Write
			</button>
		</div>
		</div>
		
	<!-- Main content area -->
	<div class="content-area">
		<!-- Sidebar - toggleable -->
		{#if showSidebar}
			<div class="sidebar">
				<div class="sidebar-scroll">
					{#if loading}
						<div class="sidebar-empty">Loading...</div>
					{:else if letters.length === 0}
						<div class="sidebar-empty">
							<span class="empty-icon">📭</span>
							<span>No letters yet</span>
						</div>
					{:else}
						{#each letters as letter (letter.id)}
							<button
								onclick={() => selectLetter(letter)}
								class="sidebar-item"
								class:active={selectedId === letter.id}
							>
								<div class="moon-badge">
									{letter.received_moons > 99 ? '99+' : letter.received_moons}
								</div>
								<div class="item-info">
									<span class="item-title">{letter.subject}</span>
									<span class="item-preview">{letter.content.slice(0, 40)}...</span>
									<div class="item-meta">
										<span>{formatDate(letter.created_at)}</span>
										<span>🌙 {letter.received_moons}</span>
									</div>
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
		
		<!-- Main content -->
		<div class="main-area">
			{#if loading}
				<div class="center-message">
					<div class="icon">📬</div>
					<p>Loading letters...</p>
				</div>
			{:else if letters.length === 0}
				<div class="center-message">
					<div class="icon">📭</div>
					<h2>No letters yet</h2>
					<p>Be the first to write a letter to Attar.</p>
					<button onclick={goToWrite} class="cta-btn">
						✉ Write First Letter
					</button>
				</div>
			{:else if selectedLetter}
				<div class="letter-view">
					<!-- Letter header -->
					<div class="letter-header">
						<div class="letter-badge">
							{selectedLetter.received_moons}
						</div>
						<div class="letter-info">
							<h2>{selectedLetter.subject}</h2>
							<span class="letter-meta">
								{formatDate(selectedLetter.created_at)} · 🌙 {selectedLetter.received_moons} moons
							</span>
			</div>
		</div>
		
					<!-- Letter content -->
					<div class="letter-content">
						<p>{selectedLetter.content}</p>
					</div>
					
					<!-- Moon voter -->
					<div class="letter-vote">
						<MoonVoter onVote={handleVote} />
					</div>
				</div>
			{:else}
				<div class="center-message">
					<div class="icon">📬</div>
					<p>Select a letter to read</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		background: linear-gradient(145deg, #1a1520 0%, #0d0a10 100%);
		z-index: 50;
	}
	
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		background: rgba(0, 0, 0, 0.5);
		border-bottom: 1px solid rgba(120, 110, 130, 0.3);
		backdrop-filter: blur(8px);
		z-index: 10;
	}
	
	.top-bar-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.top-bar-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.back-btn {
		padding: 8px 16px;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.8);
		background: rgba(200, 230, 180, 0.1);
		border: 1px solid rgba(200, 230, 180, 0.3);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.back-btn:hover {
		background: rgba(200, 230, 180, 0.2);
		color: rgba(200, 230, 180, 1);
	}
	
	.toggle-btn {
		padding: 8px 12px;
		font-size: 14px;
		color: rgba(200, 230, 180, 0.6);
		background: transparent;
		border: 1px solid rgba(120, 110, 130, 0.3);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.toggle-btn:hover, .toggle-btn.active {
		background: rgba(200, 230, 180, 0.1);
		color: rgba(200, 230, 180, 0.9);
	}
	
	.title-section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.title {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.subtitle {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.5);
	}
	
	.moon-balance {
		padding: 6px 12px;
		font-size: 11px;
		color: rgba(200, 230, 180, 0.8);
		background: rgba(200, 230, 180, 0.1);
		border-radius: 12px;
	}
	
	.write-btn {
		padding: 8px 16px;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.95);
		background: rgba(200, 230, 180, 0.15);
		border: 1px solid rgba(200, 230, 180, 0.4);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.write-btn:hover {
		background: rgba(200, 230, 180, 0.25);
	}
	
	.content-area {
		flex: 1;
		display: flex;
		min-height: 0;
		overflow: hidden;
	}
	
	.sidebar {
		width: 320px;
		flex-shrink: 0;
		background: rgba(0, 0, 0, 0.3);
		border-right: 1px solid rgba(120, 110, 130, 0.2);
		display: flex;
		flex-direction: column;
	}
	
	.sidebar-scroll {
		flex: 1;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(200, 230, 180, 0.3) transparent;
	}
	
	.sidebar-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 40px 20px;
		text-align: center;
		color: rgba(200, 230, 180, 0.5);
		font-size: 12px;
	}
	
	.empty-icon {
		font-size: 32px;
		opacity: 0.5;
	}
	
	.sidebar-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		width: 100%;
		padding: 14px 16px;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(120, 110, 130, 0.1);
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}
	
	.sidebar-item:hover {
		background: rgba(200, 230, 180, 0.05);
	}
	
	.sidebar-item.active {
		background: rgba(200, 230, 180, 0.1);
		border-left: 3px solid rgba(200, 230, 180, 0.6);
	}
	
	.moon-badge {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		font-size: 11px;
		background: rgba(200, 230, 180, 0.1);
		color: rgba(200, 230, 180, 0.8);
		flex-shrink: 0;
	}
	
	.item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.item-title {
		font-size: 13px;
		color: rgba(200, 230, 180, 0.9);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.item-preview {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.5);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.item-meta {
		display: flex;
		justify-content: space-between;
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
		margin-top: 4px;
	}
	
	.main-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}
	
	.center-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: rgba(200, 230, 180, 0.5);
		padding: 20px;
	}
	
	.center-message .icon {
		font-size: 48px;
		opacity: 0.3;
		margin-bottom: 16px;
	}
	
	.center-message h2 {
		font-size: 18px;
		color: rgba(200, 230, 180, 0.7);
		margin-bottom: 8px;
	}
	
	.center-message p {
		font-size: 13px;
		max-width: 300px;
		margin-bottom: 20px;
	}
	
	.cta-btn {
		padding: 12px 24px;
		font-size: 13px;
		color: rgba(200, 230, 180, 0.95);
		background: rgba(200, 230, 180, 0.15);
		border: 1px solid rgba(200, 230, 180, 0.4);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.cta-btn:hover {
		background: rgba(200, 230, 180, 0.25);
	}
	
	.letter-view {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	.letter-header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.letter-badge {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		font-size: 16px;
		background: rgba(200, 230, 180, 0.1);
		border: 1px solid rgba(200, 230, 180, 0.3);
		color: rgba(200, 230, 180, 0.9);
	}
	
	.letter-info {
		flex: 1;
		min-width: 0;
	}
	
	.letter-info h2 {
		font-size: 16px;
		color: rgba(200, 230, 180, 0.95);
		margin-bottom: 4px;
	}
	
	.letter-meta {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.5);
	}
	
	.letter-content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		scrollbar-width: thin;
		scrollbar-color: rgba(200, 230, 180, 0.3) transparent;
	}
	
	.letter-content p {
		font-size: 14px;
		line-height: 1.7;
		color: rgba(200, 230, 180, 0.75);
		white-space: pre-wrap;
	}
	
	.letter-vote {
		border-top: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.sidebar {
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			z-index: 5;
			box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
		}
		
		.letter-header {
			padding: 16px;
		}
		
		.letter-content {
			padding: 16px;
		}
	}
</style>
