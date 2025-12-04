<script lang="ts">
	import type { TimelineEntry } from '$lib/stores/timeline';
	import { onMount } from 'svelte';
	
	type Props = {
		entry: TimelineEntry;
		isActive?: boolean;
		compact?: boolean;
	};
	
	let { entry, isActive = false, compact = false }: Props = $props();
	
	let videoEl = $state<HTMLVideoElement | null>(null);
	
	// Detect if we have video
	const hasVideo = $derived(!!entry.worldVideoUrl);
	const mediaUrl = $derived(entry.worldVideoUrl || entry.worldImageUrl || '/worlds/be.png');
	const isVideo = $derived(mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mov'));
	
	// Auto-play video when active
	$effect(() => {
		if (videoEl) {
			if (isActive) {
				videoEl.play().catch(() => {});
			} else {
				videoEl.pause();
			}
		}
	});
</script>

<div 
	class="day-card flex flex-col rounded-lg overflow-hidden transition-all duration-500"
	class:compact
	class:is-active={isActive}
	style="
		background: linear-gradient(145deg, rgba(35, 30, 45, 0.98) 0%, rgba(20, 18, 28, 1) 100%);
		border: 1px solid {isActive ? 'rgba(200, 230, 180, 0.4)' : 'rgba(120, 110, 130, 0.3)'};
		box-shadow: {isActive ? '0 0 40px rgba(200, 230, 180, 0.1)' : 'none'};
		font-family: 'JetBrains Mono', monospace;
	"
>
	<!-- Header with day badge -->
	<div class="flex items-center justify-between px-4 py-3" style="background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(120, 110, 130, 0.2);">
		<div class="flex items-center gap-3">
			<div 
				class="px-3 py-1 rounded-full text-xs"
				style="background: {isActive ? 'rgba(200, 230, 180, 0.2)' : 'rgba(200, 230, 180, 0.1)'}; color: rgba(200, 230, 180, 0.9);"
			>
				Day {entry.day}
			</div>
			<h3 class="text-sm" style="color: rgba(200, 230, 180, 0.9);">
				{entry.title}
			</h3>
		</div>
		{#if entry.winningChoice}
			<div class="text-xs px-2 py-1 rounded" style="background: rgba(72, 209, 204, 0.15); color: rgba(72, 209, 204, 0.8);">
				→ {entry.winningChoice.title}
			</div>
		{/if}
	</div>
	
	<!-- Media section -->
	{#if !compact}
		<div class="relative overflow-hidden" style="background: rgba(0,0,0,0.5);">
			{#if isVideo}
				<video
					bind:this={videoEl}
					src={mediaUrl}
					loop
					muted
					playsinline
					crossorigin="anonymous"
					class="w-full h-auto object-contain"
					style="max-height: 60vh;"
				></video>
			{:else}
				<img 
					src={mediaUrl} 
					alt="Day {entry.day}" 
					class="w-full h-auto object-contain"
					style="max-height: 60vh;"
				/>
			{/if}
			
			<!-- Gradient overlay -->
			<div 
				class="absolute inset-0 pointer-events-none"
				style="background: linear-gradient(180deg, transparent 60%, rgba(20, 18, 28, 0.9) 100%);"
			></div>
			
			<!-- Video indicator -->
			{#if hasVideo}
				<div class="absolute top-3 right-3 px-2 py-1 rounded text-xs" style="background: rgba(0,0,0,0.6); color: rgba(200, 230, 180, 0.7);">
					▶ video
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Lore/Description -->
	{#if entry.envDescription && !compact}
		<div class="px-4 py-3" style="border-bottom: 1px solid rgba(120, 110, 130, 0.15);">
			<p class="text-sm leading-relaxed" style="color: rgba(200, 230, 180, 0.65);">
				"{entry.envDescription}"
			</p>
		</div>
	{/if}
	
	<!-- Choices with vote percentages -->
	<div class="px-4 py-3">
		<div class="text-xs mb-2" style="color: rgba(200, 230, 180, 0.5);">
			Decisions
		</div>
		<div class="space-y-2">
			{#each entry.choices as choice, idx (idx)}
				<div 
					class="relative rounded overflow-hidden"
					style="background: rgba(0,0,0,0.2);"
				>
					<!-- Vote percentage bar -->
					<div 
						class="absolute inset-y-0 left-0 transition-all duration-500"
						style="
							width: {choice.votePercentage}%;
							background: {entry.winningChoice?.title === choice.title 
								? 'rgba(72, 209, 204, 0.2)' 
								: 'rgba(200, 230, 180, 0.1)'};
						"
					></div>
					
					<!-- Content -->
					<div class="relative flex items-center justify-between px-3 py-2">
						<div class="flex items-center gap-2 min-w-0">
							{#if entry.winningChoice?.title === choice.title}
								<span class="text-xs" style="color: rgba(72, 209, 204, 0.8);">✓</span>
							{/if}
							<span 
								class="text-xs truncate"
								style="color: {entry.winningChoice?.title === choice.title 
									? 'rgba(72, 209, 204, 0.9)' 
									: 'rgba(200, 230, 180, 0.7)'};"
							>
								{choice.title}
							</span>
						</div>
						<span class="text-xs shrink-0 ml-2" style="color: rgba(200, 230, 180, 0.5);">
							{choice.votePercentage}%
						</span>
					</div>
				</div>
			{/each}
			
			{#if entry.choices.length === 0}
				<div class="text-xs text-center py-2" style="color: rgba(200, 230, 180, 0.4);">
					No decisions recorded
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.day-card {
		width: 100%;
		max-width: 600px;
	}
	
	.day-card.compact {
		max-width: 100%;
	}
	
	.day-card.is-active {
		transform: scale(1);
	}
</style>

