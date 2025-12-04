<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { TimelineEntry } from '$lib/stores/timeline';
	
	type Props = {
		entries: TimelineEntry[];
		onClose: () => void;
	};
	
	let { entries, onClose }: Props = $props();
	
	// Portal container
	let portalContainer: HTMLDivElement | null = null;
	
	// Sort entries by day ascending (oldest first for chronological playback)
	const sortedEntries = $derived([...entries].sort((a, b) => a.day - b.day));
	
	let currentIndex = $state(0);
	let isPlaying = $state(true);
	let intervalId: ReturnType<typeof setInterval> | null = null;
	
	const currentEntry = $derived(sortedEntries[currentIndex] || null);
	const progress = $derived(sortedEntries.length > 0 ? ((currentIndex + 1) / sortedEntries.length) * 100 : 0);
	
	function startPlayback() {
		if (intervalId) return;
		isPlaying = true;
		intervalId = setInterval(() => {
			if (currentIndex < sortedEntries.length - 1) {
				currentIndex++;
			} else {
				currentIndex = 0;
			}
		}, 2500);
	}
	
	function pausePlayback() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		isPlaying = false;
	}
	
	function togglePlayback() {
		if (isPlaying) {
			pausePlayback();
		} else {
			startPlayback();
		}
	}
	
	function goToSlide(index: number) {
		currentIndex = index;
	}
	
	function nextSlide() {
		if (currentIndex < sortedEntries.length - 1) {
			currentIndex++;
		}
	}
	
	function prevSlide() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === ' ') {
			e.preventDefault();
			togglePlayback();
		} else if (e.key === 'ArrowRight') {
			nextSlide();
		} else if (e.key === 'ArrowLeft') {
			prevSlide();
		}
	}
	
	onMount(() => {
		// Create portal container and append to body
		portalContainer = document.createElement('div');
		portalContainer.id = 'timeline-player-portal';
		document.body.appendChild(portalContainer);
		
		// Move our content to the portal
		const content = document.getElementById('timeline-player-content');
		if (content && portalContainer) {
			portalContainer.appendChild(content);
		}
		
		startPlayback();
	});
	
	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
		// Remove portal container
		if (portalContainer && portalContainer.parentNode) {
			portalContainer.parentNode.removeChild(portalContainer);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div id="timeline-player-content" class="player-page">
	<!-- Top bar -->
	<div class="top-bar">
		<div class="top-bar-left">
			<button onclick={onClose} class="back-btn">← Back</button>
			<div class="title-section">
				<span class="title">Timeline Player</span>
				<span class="subtitle">{sortedEntries.length} days</span>
			</div>
		</div>
		<div class="top-bar-center">
			<button class="ctrl-btn" onclick={prevSlide} disabled={currentIndex === 0}>◀◀</button>
			<button class="ctrl-btn play-btn" onclick={togglePlayback}>
				{isPlaying ? '❚❚' : '▶'}
			</button>
			<button class="ctrl-btn" onclick={nextSlide} disabled={currentIndex === sortedEntries.length - 1}>▶▶</button>
		</div>
		<div class="top-bar-right">
			<span class="slide-counter">{currentIndex + 1} / {sortedEntries.length}</span>
		</div>
	</div>
	
	<!-- Main content -->
	<div class="main-content">
		<!-- Sidebar - timeline list -->
		<div class="sidebar">
			<div class="sidebar-scroll">
				{#each sortedEntries as entry, i (entry.id)}
					<button
						class="sidebar-item"
						class:active={i === currentIndex}
						class:past={i < currentIndex}
						onclick={() => goToSlide(i)}
					>
						<div class="item-marker">
							<div class="marker-dot"></div>
							{#if i < sortedEntries.length - 1}
								<div class="marker-line"></div>
							{/if}
						</div>
						<div class="item-content">
							<span class="item-day">Day {entry.day}</span>
							<span class="item-title">{entry.title}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
		
		<!-- Main display area -->
		<div class="display-area">
			{#if currentEntry}
				<div class="slide-card">
					<!-- Media -->
					<div class="card-media">
						{#if currentEntry.worldVideoUrl}
							<video
								src={currentEntry.worldVideoUrl}
								autoplay
								loop
								muted
								playsinline
								crossorigin="anonymous"
								class="media-content"
							/>
						{:else if currentEntry.worldImageUrl}
							<img
								src={currentEntry.worldImageUrl}
								alt="Day {currentEntry.day}"
								class="media-content"
							/>
						{:else}
							<div class="no-media">◈</div>
						{/if}
						
						<!-- Pause overlay -->
						{#if !isPlaying}
							<div class="pause-overlay">
								<div class="pause-icon">❚❚</div>
								<span>Paused</span>
							</div>
						{/if}
					</div>
					
					<!-- Card info -->
					<div class="card-info">
						<div class="info-header">
							<span class="day-badge">Day {currentEntry.day}</span>
							{#if currentEntry.winningChoice}
								<span class="choice-badge">
									→ {currentEntry.winningChoice.title}
								</span>
							{/if}
						</div>
						<h1 class="card-title">{currentEntry.title}</h1>
						{#if currentEntry.envDescription}
							<p class="card-desc">{currentEntry.envDescription}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Progress bar -->
	<div class="progress-bar">
		<div class="progress-fill" style="width: {progress}%"></div>
	</div>
</div>

<style>
	.player-page {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		background: linear-gradient(145deg, #1a1520 0%, #0d0a10 100%);
		font-family: 'JetBrains Mono', monospace;
	}
	
	/* Top bar */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		background: rgba(0, 0, 0, 0.5);
		border-bottom: 1px solid rgba(120, 110, 130, 0.3);
		backdrop-filter: blur(8px);
		z-index: 10;
	}
	
	.top-bar-left, .top-bar-right {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
	}
	
	.top-bar-right {
		justify-content: flex-end;
	}
	
	.top-bar-center {
		display: flex;
		align-items: center;
		gap: 8px;
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
		font-family: inherit;
	}
	
	.back-btn:hover {
		background: rgba(200, 230, 180, 0.2);
		color: rgba(200, 230, 180, 1);
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
	
	.ctrl-btn {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		border: 1px solid rgba(200, 230, 180, 0.3);
		background: rgba(200, 230, 180, 0.1);
		color: rgba(200, 230, 180, 0.8);
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: inherit;
	}
	
	.ctrl-btn:hover:not(:disabled) {
		background: rgba(200, 230, 180, 0.2);
		color: rgba(200, 230, 180, 1);
	}
	
	.ctrl-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	.play-btn {
		width: 56px;
		height: 56px;
		font-size: 18px;
		background: rgba(147, 112, 219, 0.25);
		border-color: rgba(147, 112, 219, 0.5);
		color: rgba(220, 210, 255, 0.95);
		border-radius: 50%;
	}
	
	.play-btn:hover {
		background: rgba(147, 112, 219, 0.35);
		transform: scale(1.05);
	}
	
	.slide-counter {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.5);
		padding: 6px 12px;
		background: rgba(200, 230, 180, 0.1);
		border-radius: 12px;
	}
	
	/* Main content */
	.main-content {
		flex: 1;
		display: flex;
		min-height: 0;
		overflow: hidden;
	}
	
	/* Sidebar */
	.sidebar {
		width: 280px;
		flex-shrink: 0;
		background: rgba(0, 0, 0, 0.3);
		border-right: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.sidebar-scroll {
		height: 100%;
		overflow-y: auto;
		padding: 16px;
		scrollbar-width: thin;
		scrollbar-color: rgba(147, 112, 219, 0.3) transparent;
	}
	
	.sidebar-item {
		display: flex;
		gap: 12px;
		width: 100%;
		padding: 12px;
		background: transparent;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		font-family: inherit;
	}
	
	.sidebar-item:hover {
		background: rgba(147, 112, 219, 0.1);
	}
	
	.sidebar-item.active {
		background: rgba(147, 112, 219, 0.2);
	}
	
	.item-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 12px;
		padding-top: 4px;
	}
	
	.marker-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(200, 230, 180, 0.3);
		border: 2px solid transparent;
		transition: all 0.2s;
	}
	
	.sidebar-item.past .marker-dot {
		background: rgba(147, 112, 219, 0.5);
	}
	
	.sidebar-item.active .marker-dot {
		background: rgba(147, 112, 219, 0.9);
		border-color: rgba(147, 112, 219, 0.5);
		box-shadow: 0 0 10px rgba(147, 112, 219, 0.5);
	}
	
	.marker-line {
		flex: 1;
		width: 2px;
		min-height: 20px;
		background: rgba(200, 230, 180, 0.15);
		margin-top: 4px;
	}
	
	.sidebar-item.past .marker-line {
		background: rgba(147, 112, 219, 0.3);
	}
	
	.item-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.item-day {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.5);
	}
	
	.sidebar-item.active .item-day {
		color: rgba(147, 112, 219, 0.9);
	}
	
	.item-title {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.sidebar-item.active .item-title {
		color: rgba(220, 210, 255, 0.95);
	}
	
	/* Display area */
	.display-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		min-width: 0;
		overflow-y: auto;
	}
	
	.slide-card {
		width: 100%;
		max-width: 1100px;
		border-radius: 16px;
		overflow: hidden;
		background: linear-gradient(145deg, rgba(50, 45, 60, 1) 0%, rgba(35, 30, 45, 1) 100%);
		border: 1px solid rgba(120, 110, 130, 0.4);
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
	}
	
	.card-media {
		position: relative;
		width: 100%;
		background: rgba(0, 0, 0, 0.4);
	}
	
	.media-content {
		width: 100%;
		height: auto;
		display: block;
	}
	
	.no-media {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 80px;
		color: rgba(200, 230, 180, 0.1);
	}
	
	.pause-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: rgba(255, 255, 255, 0.8);
	}
	
	.pause-icon {
		font-size: 48px;
		letter-spacing: 8px;
	}
	
	.pause-overlay span {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.6);
	}
	
	.card-info {
		padding: 20px 28px;
		border-top: 1px solid rgba(120, 110, 130, 0.3);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.info-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}
	
	.day-badge {
		padding: 8px 16px;
		border-radius: 20px;
		background: rgba(147, 112, 219, 0.2);
		border: 1px solid rgba(147, 112, 219, 0.4);
		color: rgba(220, 210, 255, 0.95);
		font-size: 13px;
	}
	
	.choice-badge {
		padding: 8px 14px;
		border-radius: 8px;
		background: rgba(72, 209, 204, 0.1);
		border: 1px solid rgba(72, 209, 204, 0.3);
		color: rgba(72, 209, 204, 0.9);
		font-size: 12px;
	}
	
	.card-title {
		font-size: 24px;
		color: rgba(255, 255, 255, 0.95);
		margin: 0 0 12px 0;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.card-desc {
		font-size: 13px;
		color: rgba(200, 230, 180, 0.6);
		margin: 0;
		line-height: 1.6;
		flex: 1;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}
	
	/* Progress bar */
	.progress-bar {
		height: 4px;
		background: rgba(200, 230, 180, 0.1);
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, rgba(147, 112, 219, 0.8), rgba(200, 230, 180, 0.8));
		transition: width 0.3s ease;
	}
	
	/* Responsive */
	@media (max-width: 900px) {
		.sidebar {
			display: none;
		}
		
		.display-area {
			padding: 12px;
		}
		
		.card-title {
			font-size: 18px;
		}
		
		.card-info {
			padding: 14px 18px;
		}
	}
</style>
