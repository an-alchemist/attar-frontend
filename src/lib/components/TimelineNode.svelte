<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { getTimelineEntries, type TimelineEntry } from '$lib/stores/timeline';
	
	type TimelineNodeData = {
		label?: string;
	};
	
	let { data }: NodeProps<TimelineNodeData> = $props();
	
	let timeline = $state<TimelineEntry[]>([]);
	let loading = $state(true);
	let hoveredEntry = $state<number | null>(null);
	
	// Get first and last day for footer
	const firstDay = $derived(timeline.length > 0 ? timeline[timeline.length - 1].day : 1);
	const lastDay = $derived(timeline.length > 0 ? timeline[0].day : 1);
	
	onMount(async () => {
		timeline = await getTimelineEntries();
		loading = false;
	});
	
	function openFullTimeline() {
		window.location.href = '/timeline';
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="timeline-node flex flex-col w-full h-full rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
	<!-- Center handle for center-to-center connection -->
	<Handle type="target" position={Position.Left} id="center" class="!opacity-0 !w-1 !h-1" style="top: 50%; left: 50%;" />
	
	<!-- Terminal header -->
	<div class="flex items-center justify-between px-3 py-2 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
		<div class="flex items-center gap-2">
			<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8);">
				Timeline.exe
			</span>
		</div>
		<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.5);">
			{#if loading}
				loading...
			{:else}
				{timeline.length} entries
			{/if}
		</span>
	</div>
	
	<!-- Timeline content - scrollable -->
	<div class="flex-1 overflow-y-auto min-h-0 px-3 py-3" style="scrollbar-width: thin; scrollbar-color: rgba(200, 230, 180, 0.3) transparent;">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">Loading timeline...</span>
			</div>
		{:else if timeline.length === 0}
			<div class="flex items-center justify-center h-full flex-col gap-2">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">No entries yet</span>
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.3);">Genesis awaits...</span>
			</div>
		{:else}
			<div class="timeline-container relative">
				<!-- Vertical line -->
				<div class="timeline-line"></div>
				
				{#each timeline as entry, idx (entry.id)}
					<div 
						class="timeline-entry"
						class:is-first={idx === 0}
						onmouseenter={() => hoveredEntry = entry.day}
						onmouseleave={() => hoveredEntry = null}
						style="opacity: {hoveredEntry === null || hoveredEntry === entry.day ? 1 : 0.5};"
					>
						<!-- Day marker -->
						<div class="timeline-marker" class:is-current={idx === 0}>
							<div class="marker-dot"></div>
							{#if idx < timeline.length - 1}
								<div class="marker-arrow">↓</div>
							{/if}
						</div>
						
						<!-- Entry content -->
						<div class="timeline-content">
							<div class="entry-header">
								<span class="entry-day">Day {entry.day}</span>
								<span class="entry-title">{entry.title}</span>
							</div>
							
							<div class="entry-body">
								<div class="entry-image-container">
									<img 
										src={entry.worldImageUrl || entry.entityImageUrl || '/worlds/be.png'} 
										alt="Day {entry.day}" 
										class="entry-image" 
									/>
									{#if entry.worldVideoUrl}
										<div class="video-badge">▶</div>
									{/if}
								</div>
								<div class="entry-details">
									{#if entry.winningChoice}
										<div class="entry-decision">
											<span class="decision-label">→</span>
											<span>{entry.winningChoice.title}</span>
										</div>
									{/if}
									<p class="entry-summary">"{entry.envDescription || entry.title}"</p>
								</div>
							</div>
						</div>
					</div>
				{/each}
				
				<!-- End marker -->
				<div class="timeline-end">
					<span class="end-dot">◆</span>
					<span class="end-text">Genesis</span>
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Footer -->
	<div class="px-3 py-2 shrink-0 flex items-center justify-between" style="background: rgba(0,0,0,0.2); border-top: 1px solid rgba(120, 110, 130, 0.2);">
		<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.4);">
			{#if !loading && timeline.length > 0}
				day {firstDay} → {lastDay}
			{/if}
		</span>
		<button
			onclick={openFullTimeline}
			class="text-xs px-2 py-1 rounded transition-all hover:scale-105"
			style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8); border: 1px solid rgba(200, 230, 180, 0.3); background: rgba(200, 230, 180, 0.1);"
		>
			View All
		</button>
	</div>
</div>

<style>
	.timeline-node {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		font-family: 'JetBrains Mono', monospace;
	}
	
	.timeline-container {
		position: relative;
		padding-left: 20px;
	}
	
	.timeline-line {
		position: absolute;
		left: 6px;
		top: 8px;
		bottom: 40px;
		width: 1px;
		background: linear-gradient(180deg, rgba(200, 230, 180, 0.5) 0%, rgba(200, 230, 180, 0.1) 100%);
	}
	
	.timeline-entry {
		position: relative;
		margin-bottom: 16px;
		transition: opacity 0.2s ease;
	}
	
	.timeline-entry:last-child {
		margin-bottom: 8px;
	}
	
	.timeline-marker {
		position: absolute;
		left: -20px;
		top: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	
	.marker-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(200, 230, 180, 0.4);
		border: 1px solid rgba(200, 230, 180, 0.6);
	}
	
	.is-current .marker-dot {
		background: rgba(200, 230, 180, 0.9);
		box-shadow: 0 0 8px rgba(200, 230, 180, 0.5);
	}
	
	.marker-arrow {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.3);
		line-height: 1;
		animation: pulse-arrow 2s infinite;
	}
	
	@keyframes pulse-arrow {
		0%, 100% { opacity: 0.3; transform: translateY(0); }
		50% { opacity: 0.6; transform: translateY(2px); }
	}
	
	.timeline-content {
		padding: 8px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 6px;
		border: 1px solid rgba(120, 110, 130, 0.2);
		transition: all 0.2s ease;
	}
	
	.timeline-entry:hover .timeline-content {
		background: rgba(0, 0, 0, 0.3);
		border-color: rgba(200, 230, 180, 0.3);
	}
	
	.is-first .timeline-content {
		border-color: rgba(200, 230, 180, 0.3);
		background: rgba(200, 230, 180, 0.05);
	}
	
	.entry-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}
	
	.entry-day {
		font-size: 10px;
		padding: 2px 8px;
		border-radius: 8px;
		background: rgba(200, 230, 180, 0.15);
		color: rgba(200, 230, 180, 0.7);
	}
	
	.is-first .entry-day {
		background: rgba(200, 230, 180, 0.25);
		color: rgba(200, 230, 180, 0.9);
	}
	
	.entry-title {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.85);
		font-weight: 500;
	}
	
	.entry-body {
		display: flex;
		gap: 8px;
	}
	
	.entry-image-container {
		position: relative;
		width: 44px;
		height: 44px;
		border-radius: 6px;
		overflow: hidden;
		flex-shrink: 0;
		border: 1px solid rgba(120, 110, 130, 0.3);
	}
	
	.entry-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.video-badge {
		position: absolute;
		bottom: 2px;
		right: 2px;
		font-size: 8px;
		padding: 1px 3px;
		border-radius: 2px;
		background: rgba(0, 0, 0, 0.7);
		color: rgba(200, 230, 180, 0.8);
	}
	
	.entry-details {
		flex: 1;
		min-width: 0;
	}
	
	.entry-decision {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		color: rgba(72, 209, 204, 0.8);
		margin-bottom: 4px;
	}
	
	.decision-label {
		color: rgba(72, 209, 204, 0.5);
	}
	
	.entry-summary {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.5);
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	
	.timeline-end {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 0;
		margin-left: -14px;
	}
	
	.end-dot {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
	}
	
	.end-text {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.3);
		font-style: italic;
	}
	
	/* Scrollbar */
	.timeline-node ::-webkit-scrollbar {
		width: 4px;
	}
	
	.timeline-node ::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.timeline-node ::-webkit-scrollbar-thumb {
		background: rgba(200, 230, 180, 0.3);
		border-radius: 2px;
	}
</style>
