<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { getTimelineEntries, type TimelineEntry } from '$lib/stores/timeline';
	import { isMobile } from '$lib/stores/mobile';
	import DayCard from '$lib/components/DayCard.svelte';
	
	let timeline = $state<TimelineEntry[]>([]);
	let loading = $state(true);
	let activeIndex = $state(0);
	let containerEl = $state<HTMLElement | null>(null);
	let showSidebar = $state(true);
	
	// Mobile view state: 'list' or 'detail'
	let mobileView = $state<'list' | 'detail'>('list');
	
	// Get first and last day for display
	const firstDay = $derived(timeline.length > 0 ? timeline[timeline.length - 1].day : 1);
	const lastDay = $derived(timeline.length > 0 ? timeline[0].day : 1);
	const currentEntry = $derived(timeline[activeIndex] || null);
	
	onMount(async () => {
		timeline = await getTimelineEntries();
		loading = false;
	});
	
	async function goBack() {
		// On mobile detail view, go back to list first
		if ($isMobile && mobileView === 'detail') {
			mobileView = 'list';
			return;
		}
		await invalidateAll();
		goto('/');
	}
	
	function scrollToEntry(index: number) {
		if (index < 0 || index >= timeline.length) return;
		activeIndex = index;
		
		// On mobile, switch to detail view
		if ($isMobile) {
			mobileView = 'detail';
			return;
		}
		
		// Scroll the card into view (desktop)
		const card = containerEl?.querySelector(`[data-index="${index}"]`);
		if (card) {
			card.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
	
	function handleScroll(e: Event) {
		if (!containerEl || $isMobile) return;
		
		const cards = containerEl.querySelectorAll('.day-card-wrapper');
		const containerRect = containerEl.getBoundingClientRect();
		const containerCenter = containerRect.top + containerRect.height / 2;
		
		let closestIndex = 0;
		let closestDistance = Infinity;
		
		cards.forEach((card, index) => {
			const cardRect = card.getBoundingClientRect();
			const cardCenter = cardRect.top + cardRect.height / 2;
			const distance = Math.abs(cardCenter - containerCenter);
			
			if (distance < closestDistance) {
				closestDistance = distance;
				closestIndex = index;
			}
		});
		
		if (closestIndex !== activeIndex) {
			activeIndex = closestIndex;
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'j') {
			e.preventDefault();
			scrollToEntry(activeIndex + 1);
		} else if (e.key === 'ArrowUp' || e.key === 'k') {
			e.preventDefault();
			scrollToEntry(activeIndex - 1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			scrollToEntry(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			scrollToEntry(timeline.length - 1);
		} else if (e.key === 'Escape') {
			goBack();
		}
	}
	
	function toggleSidebar() {
		showSidebar = !showSidebar;
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
	<title>Timeline - Attar</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="page-container" style="font-family: 'JetBrains Mono', monospace;">
	<!-- Fixed top bar with back button -->
	<div class="top-bar">
		<div class="top-bar-left">
			<button onclick={goBack} class="back-btn">
				{#if $isMobile && mobileView === 'detail'}
					← List
				{:else}
					← Back
				{/if}
			</button>
			{#if !$isMobile}
				<button onclick={toggleSidebar} class="toggle-btn" class:active={showSidebar}>
					☰
				</button>
			{/if}
			<div class="title-section">
				<span class="title">Timeline.att</span>
				<span class="subtitle">{timeline.length} days</span>
			</div>
		</div>
		<div class="top-bar-right">
			{#if currentEntry}
				<span class="current-day">Day {currentEntry.day}</span>
			{/if}
		</div>
	</div>
	
	<!-- Mobile View -->
	{#if $isMobile}
		<div class="mobile-content">
			{#if loading}
				<div class="center-message">
					<div class="icon">↓</div>
					<p>Loading timeline...</p>
				</div>
			{:else if timeline.length === 0}
				<div class="center-message">
					<div class="icon">◆</div>
					<h2>Genesis Awaits</h2>
					<p>The timeline will begin when the first day is recorded.</p>
				</div>
			{:else if mobileView === 'list'}
				<!-- Mobile List View -->
				<div class="mobile-list">
					{#each timeline as entry, idx (entry.id)}
						<button
							onclick={() => scrollToEntry(idx)}
							class="mobile-list-item"
						>
							<div class="day-badge" class:active={activeIndex === idx}>
								{entry.day}
							</div>
							<div class="item-info">
								<span class="item-title">{entry.title}</span>
								{#if entry.winningChoice}
									<span class="item-decision">→ {entry.winningChoice.title}</span>
								{/if}
							</div>
							{#if entry.worldVideoUrl}
								<span class="video-indicator">▶</span>
							{:else}
								<span class="chevron">›</span>
							{/if}
						</button>
					{/each}
					
					<!-- Genesis marker -->
					<div class="genesis-marker">
						<span class="genesis-icon">◆</span>
						<span class="genesis-text">Genesis</span>
						<p class="genesis-desc">The beginning of Attar's journey.</p>
					</div>
				</div>
			{:else if mobileView === 'detail' && currentEntry}
				<!-- Mobile Detail View -->
				<div class="mobile-detail">
					<DayCard entry={currentEntry} isActive={true} />
					
					<!-- Navigation -->
					<div class="mobile-nav">
						<button 
							onclick={() => { activeIndex = Math.max(0, activeIndex - 1); }}
							disabled={activeIndex === 0}
							class="nav-btn"
						>
							← Prev
						</button>
						<span class="nav-indicator">{activeIndex + 1} / {timeline.length}</span>
						<button 
							onclick={() => { activeIndex = Math.min(timeline.length - 1, activeIndex + 1); }}
							disabled={activeIndex === timeline.length - 1}
							class="nav-btn"
						>
							Next →
						</button>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Desktop View -->
		<div class="content-area">
			<!-- Sidebar - toggleable -->
			{#if showSidebar}
				<div class="sidebar">
					<div class="sidebar-scroll">
						{#if loading}
							<div class="sidebar-empty">Loading...</div>
						{:else}
							{#each timeline as entry, idx (entry.id)}
								<button
									onclick={() => scrollToEntry(idx)}
									class="sidebar-item"
									class:active={activeIndex === idx}
								>
									<div 
										class="day-badge"
										class:active={activeIndex === idx}
									>
										{entry.day}
									</div>
									<div class="item-info">
										<span class="item-title">{entry.title}</span>
										{#if entry.winningChoice}
											<span class="item-decision">→ {entry.winningChoice.title}</span>
										{/if}
									</div>
									{#if entry.worldVideoUrl}
										<span class="video-indicator">▶</span>
									{/if}
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Main scroll area -->
			<div 
				class="main-area"
				bind:this={containerEl}
				onscroll={handleScroll}
			>
				{#if loading}
					<div class="center-message">
						<div class="icon">↓</div>
						<p>Loading timeline...</p>
					</div>
				{:else if timeline.length === 0}
					<div class="center-message">
						<div class="icon">◆</div>
						<h2>Genesis Awaits</h2>
						<p>The timeline will begin when the first day is recorded.</p>
					</div>
				{:else}
					<div class="cards-container">
						{#each timeline as entry, idx (entry.id)}
							<div 
								class="day-card-wrapper"
								data-index={idx}
							>
								<DayCard 
									{entry} 
									isActive={activeIndex === idx}
								/>
							</div>
						{/each}
						
						<!-- Genesis marker -->
						<div class="genesis-marker">
							<span class="genesis-icon">◆</span>
							<span class="genesis-text">Genesis</span>
							<p class="genesis-desc">The beginning of Attar's journey.</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
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
		padding: 10px 18px;
		font-size: 13px;
		color: rgba(200, 230, 180, 0.8);
		background: rgba(200, 230, 180, 0.1);
		border: 1px solid rgba(200, 230, 180, 0.3);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s;
		min-height: 44px;
		min-width: 44px;
		-webkit-tap-highlight-color: transparent;
	}
	
	.back-btn:hover {
		background: rgba(200, 230, 180, 0.2);
		color: rgba(200, 230, 180, 1);
	}
	
	.back-btn:active {
		transform: scale(0.95);
		background: rgba(200, 230, 180, 0.25);
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
	
	.current-day {
		padding: 6px 12px;
		font-size: 11px;
		color: rgba(72, 209, 204, 0.9);
		background: rgba(72, 209, 204, 0.15);
		border: 1px solid rgba(72, 209, 204, 0.3);
		border-radius: 12px;
	}
	
	.content-area {
		flex: 1;
		display: flex;
		min-height: 0;
		overflow: hidden;
	}
	
	.sidebar {
		width: 280px;
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
		padding: 20px;
		text-align: center;
		color: rgba(200, 230, 180, 0.5);
		font-size: 12px;
	}
	
	.sidebar-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
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
	
	.day-badge {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		font-size: 12px;
		background: rgba(200, 230, 180, 0.1);
		color: rgba(200, 230, 180, 0.7);
		flex-shrink: 0;
	}
	
	.day-badge.active {
		background: rgba(200, 230, 180, 0.2);
		color: rgba(200, 230, 180, 0.95);
	}
	
	.item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.item-title {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.item-decision {
		font-size: 10px;
		color: rgba(72, 209, 204, 0.6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.video-indicator {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
		flex-shrink: 0;
	}
	
	.main-area {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		scrollbar-width: thin;
		scrollbar-color: rgba(200, 230, 180, 0.3) transparent;
	}
	
	.center-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: rgba(200, 230, 180, 0.5);
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
	}
	
	.cards-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		max-width: 640px;
		margin: 0 auto;
	}
	
	.day-card-wrapper {
		width: 100%;
	}
	
	.genesis-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px 0;
		color: rgba(200, 230, 180, 0.4);
	}
	
	.genesis-icon {
		font-size: 24px;
	}
	
	.genesis-text {
		font-size: 14px;
	}
	
	.genesis-desc {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.3);
	}
	
	/* Responsive - Desktop sidebar overlay (fallback) */
	@media (max-width: 768px) {
		.sidebar {
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			z-index: 5;
			box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
		}
		
		.main-area {
			padding: 16px;
		}
	}
	
	/* Mobile-specific styles */
	.mobile-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.mobile-list {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}
	
	.mobile-list-item {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		padding: 16px 20px;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(120, 110, 130, 0.15);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}
	
	.mobile-list-item:active {
		background: rgba(200, 230, 180, 0.08);
	}
	
	.mobile-list-item .day-badge {
		width: 44px;
		height: 44px;
		font-size: 14px;
	}
	
	.mobile-list-item .item-info {
		flex: 1;
		min-width: 0;
	}
	
	.mobile-list-item .item-title {
		font-size: 14px;
		margin-bottom: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.mobile-list-item .item-decision {
		font-size: 12px;
	}
	
	.chevron {
		font-size: 24px;
		color: rgba(200, 230, 180, 0.3);
		flex-shrink: 0;
	}
	
	/* Mobile Detail View */
	.mobile-detail {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.mobile-detail :global(.day-card) {
		flex: 1;
		overflow-y: auto;
	}
	
	.mobile-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		background: rgba(0, 0, 0, 0.3);
		border-top: 1px solid rgba(120, 110, 130, 0.2);
		padding-bottom: max(16px, env(safe-area-inset-bottom));
	}
	
	.nav-btn {
		padding: 12px 20px;
		font-size: 13px;
		color: rgba(200, 230, 180, 0.8);
		background: rgba(200, 230, 180, 0.1);
		border: 1px solid rgba(200, 230, 180, 0.3);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	.nav-btn:active:not(:disabled) {
		background: rgba(200, 230, 180, 0.2);
		transform: scale(0.97);
	}
	
	.nav-indicator {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.5);
	}
</style>
