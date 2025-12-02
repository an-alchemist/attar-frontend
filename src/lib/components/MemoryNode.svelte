<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	import { onMount } from 'svelte';
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
		window.location.href = `/memories?selected=${memory.id}`;
	}
	
	function openAllMemories() {
		window.location.href = '/memories';
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="memory-node flex flex-col w-full h-full rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
	<!-- Center handle for center-to-center connection -->
	<Handle type="target" position={Position.Left} id="center" class="!opacity-0 !w-1 !h-1" style="top: 50%; left: 50%;" />
	
	<!-- Terminal header -->
	<div class="flex items-center justify-between px-3 py-2 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
		<div class="flex items-center gap-2">
			<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8);">
				Memory.exe
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
				{#each memories.slice(0, 24) as memory (memory.id)}
					<button
						class="memory-square"
						style="
							background: {getColorForDay(memory.day)};
							transform: {hoveredDay === memory.day ? 'scale(1.15)' : 'scale(1)'};
							box-shadow: {hoveredDay === memory.day ? '0 0 12px ' + getColorForDay(memory.day) : 'none'};
							z-index: {hoveredDay === memory.day ? '10' : '1'};
						"
						onmouseenter={() => hoveredDay = memory.day}
						onmouseleave={() => hoveredDay = null}
						onclick={() => openMemory(memory)}
						title="Day {memory.day}"
					>
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
	
	.square-indicator {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
	}
</style>
