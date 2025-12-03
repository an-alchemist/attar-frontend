<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	
	type SatelliteNodeData = {
		label: string;
		image: string;
		id?: string;
	};
	
	let { data }: NodeProps<SatelliteNodeData> = $props();
	
	// Generate a random ID for the footer
	const nodeId = Math.floor(Math.random() * 900000) + 100000;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="satellite-node flex flex-col w-full h-full rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
	<Handle type="target" position={Position.Left} class="!opacity-0 !w-1 !h-1" style="top: 50%; left: 0;" />
	<Handle type="target" position={Position.Top} class="!opacity-0 !w-1 !h-1" />
	<Handle type="target" position={Position.Bottom} class="!opacity-0 !w-1 !h-1" />
	
	<!-- Terminal header -->
	<div class="flex items-center px-3 py-2 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
		<div class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8);">
			{data.label || 'Unknown'}.att
		</div>
	</div>
	
	<!-- Image content - fills available space -->
	<div class="flex-1 p-2 min-h-0">
		{#if data.image}
			<img src={data.image} alt={data.label} class="w-full h-full object-cover rounded" />
		{:else}
			<div class="w-full h-full flex items-center justify-center rounded" style="background: rgba(0,0,0,0.2); color: rgba(200, 230, 180, 0.5); font-family: 'JetBrains Mono', monospace; font-size: 10px;">
				No image
			</div>
		{/if}
	</div>
	
	<!-- Footer -->
	<div class="px-3 py-2 shrink-0" style="background: rgba(0,0,0,0.15); border-top: 1px solid rgba(120, 110, 130, 0.2);">
		<div class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.6);">
			Flora #{nodeId}
		</div>
	</div>
</div>

<style>
	.satellite-node {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
</style>

