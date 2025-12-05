<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getMemories, type MemoryEntry } from '$lib/stores/memory';
	
	type MemoryNodeData = {
		label?: string;
	};
	
	let { data }: NodeProps<MemoryNodeData> = $props();
	
	let memories = $state<MemoryEntry[]>([]);
	let loading = $state(true);
	let hoveredDay = $state<number | null>(null);
	
	const latestDay = $derived(memories.length > 0 ? memories[0].day : 0);
	
	// Color palette for memory squares
	const colors = [
		'rgba(147, 112, 219, 0.6)', // purple
		'rgba(100, 149, 237, 0.6)', // cornflower
		'rgba(72, 209, 204, 0.6)',  // turquoise
		'rgba(144, 238, 144, 0.6)', // light green
		'rgba(255, 182, 193, 0.6)', // pink
		'rgba(255, 218, 185, 0.6)', // peach
		'rgba(176, 196, 222, 0.6)', // steel blue
	];
	
	function getColorForDay(day: number): string {
		return colors[day % colors.length];
	}
	
	onMount(async () => {
		memories = await getMemories();
		loading = false;
	});
	
	function openMemory(memory: MemoryEntry) {
		// Navigate to memories page with selected memory ID
		goto(`/memories?selected=${memory.id}`);
	}
	
	function openAllMemories() {
		goto('/memories');
	}
</script>

<!-- Font loaded in app.html -->

<div class="memory-node flex flex-col w-full h-full rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
	<!-- Center handle for center-to-center connection -->
	<Handle type="target" position={Position.Left} id="center" class="!opacity-0 !w-1 !h-1" style="top: 50%; left: 50%;" />
	
	<!-- Terminal header -->
	<div class="flex items-center justify-between px-3 py-2 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
		<div class="flex items-center gap-2">
			<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8);">
				Memory.att
			</span>
		</div>
		<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.5);">
			{#if loading}
				loading...
			{:else}
				{memories.length} days
			{/if}
		</span>
	</div>
	
	<!-- Memory grid -->
	<div class="flex-1 p-3 min-h-0 overflow-hidden">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">Loading memories...</span>
			</div>
		{:else if memories.length === 0}
			<div class="flex items-center justify-center h-full flex-col gap-2">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">No memories yet</span>
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.3);">Genesis awaits...</span>
			</div>
		{:else}
			<div class="memory-grid">
				{#each memories.slice(0, 24) as memory, index (memory.id)}
					<button
						class="memory-square living-square"
						style="
							--base-color: {getColorForDay(memory.day)};
							--glow-color: {getColorForDay(memory.day).replace('0.6', '0.8')};
							--delay: {(index % 6) * 0.15 + Math.floor(index / 6) * 0.2}s;
							--duration: {2.5 + (index % 3) * 0.5}s;
							transform: {hoveredDay === memory.day ? 'scale(1.15)' : 'scale(1)'};
							z-index: {hoveredDay === memory.day ? '10' : '1'};
						"
						onmouseenter={() => hoveredDay = memory.day}
						onmouseleave={() => hoveredDay = null}
						onclick={() => openMemory(memory)}
						title="Day {memory.day}"
					>
						<span class="square-shimmer"></span>
						<span class="square-pulse"></span>
						{#if memory.newKnowledge.length > 0}
							<span class="square-indicator"></span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Footer -->
	<div class="px-3 py-2 shrink-0 flex items-center justify-between" style="background: rgba(0,0,0,0.2); border-top: 1px solid rgba(120, 110, 130, 0.2);">
		<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.4);">
			{#if !loading && memories.length > 0}
				day {latestDay}
			{/if}
		</span>
		<button
			onclick={openAllMemories}
			disabled={loading}
			class="text-xs px-2 py-1 rounded transition-all hover:scale-105"
			style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8); border: 1px solid rgba(200, 230, 180, 0.3); background: rgba(200, 230, 180, 0.1);"
		>
			View All
		</button>
	</div>
</div>

<style>
	.memory-node {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
	
	.memory-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 6px;
		width: 100%;
		height: 100%;
	}
	
	.memory-square {
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		min-height: 0;
	}
	
	.memory-square:hover {
		border-color: rgba(255, 255, 255, 0.3);
	}
	
	/* Living hypnotic square effects */
	.living-square {
		background: var(--base-color);
		overflow: hidden;
		animation: breathe var(--duration) ease-in-out infinite;
		animation-delay: var(--delay);
	}
	
	/* Breathing pulse - makes squares feel alive */
	@keyframes breathe {
		0%, 100% {
			box-shadow: 
				inset 0 0 8px rgba(255, 255, 255, 0.1),
				0 0 4px var(--base-color);
			filter: brightness(1);
		}
		50% {
			box-shadow: 
				inset 0 0 15px rgba(255, 255, 255, 0.25),
				0 0 12px var(--glow-color);
			filter: brightness(1.15);
		}
	}
	
	/* Light shimmer sweep effect */
	.square-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			115deg,
			transparent 0%,
			transparent 30%,
			rgba(255, 255, 255, 0.25) 45%,
			rgba(255, 255, 255, 0.4) 50%,
			rgba(255, 255, 255, 0.25) 55%,
			transparent 70%,
			transparent 100%
		);
		transform: translateX(-150%);
		animation: shimmer 4s ease-in-out infinite;
		animation-delay: calc(var(--delay) + 1s);
		pointer-events: none;
	}
	
	@keyframes shimmer {
		0%, 85%, 100% {
			transform: translateX(-150%);
		}
		35%, 50% {
			transform: translateX(150%);
		}
	}
	
	/* Inner pulse ring effect */
	.square-pulse {
		position: absolute;
		inset: 0;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0);
		animation: pulse-ring 3s ease-out infinite;
		animation-delay: calc(var(--delay) * 2);
		pointer-events: none;
	}
	
	@keyframes pulse-ring {
		0%, 70%, 100% {
			border-color: rgba(255, 255, 255, 0);
			transform: scale(0.8);
			opacity: 0;
		}
		35% {
			border-color: rgba(255, 255, 255, 0.6);
			transform: scale(1);
			opacity: 1;
		}
	}
	
	/* Hover state - intensify the living effect */
	.living-square:hover {
		animation-play-state: paused;
		box-shadow: 
			inset 0 0 20px rgba(255, 255, 255, 0.3),
			0 0 20px var(--glow-color) !important;
		filter: brightness(1.25) !important;
	}
	
	.living-square:hover .square-shimmer {
		animation-play-state: paused;
		transform: translateX(0);
		background: linear-gradient(
			115deg,
			transparent 0%,
			rgba(255, 255, 255, 0.1) 30%,
			rgba(255, 255, 255, 0.2) 50%,
			rgba(255, 255, 255, 0.1) 70%,
			transparent 100%
		);
	}
	
	.square-indicator {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
		animation: indicator-glow 1.5s ease-in-out infinite;
		z-index: 2;
	}
	
	@keyframes indicator-glow {
		0%, 100% {
			box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
			transform: scale(1);
		}
		50% {
			box-shadow: 0 0 8px rgba(255, 255, 255, 0.9);
			transform: scale(1.2);
		}
	}
</style>
