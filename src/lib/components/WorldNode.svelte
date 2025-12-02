<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	import WorldCard from './WorldCard.svelte';
	
	type Choice = {
		id: string;
		title: string;
		description: string;
		votes: number;
	};
	
	type WorldNodeData = {
		title: string;
		image: string;
		choices: Choice[];
		day?: number;
		backstoryLine?: string;
		envId?: string;
	};
	
	let { data }: NodeProps<WorldNodeData> = $props();
</script>

<div class="world-node w-full h-full relative">
	<!-- Center handle for edges to originate from -->
	<Handle 
		type="source" 
		position={Position.Right} 
		id="center"
		class="!opacity-0 !w-1 !h-1"
		style="top: 50%; left: 50%; transform: translate(-50%, -50%);"
	/>
	<Handle 
		type="source" 
		position={Position.Left} 
		id="center-left"
		class="!opacity-0 !w-1 !h-1"
		style="top: 50%; left: 50%; transform: translate(-50%, -50%);"
	/>
	<Handle 
		type="source" 
		position={Position.Top} 
		id="center-top"
		class="!opacity-0 !w-1 !h-1"
		style="top: 50%; left: 50%; transform: translate(-50%, -50%);"
	/>
	<Handle 
		type="source" 
		position={Position.Bottom} 
		id="center-bottom"
		class="!opacity-0 !w-1 !h-1"
		style="top: 50%; left: 50%; transform: translate(-50%, -50%);"
	/>
	
	<WorldCard 
		title={data.title}
		image={data.image}
		choices={data.choices}
		day={data.day}
		backstoryLine={data.backstoryLine}
		envId={data.envId}
	/>
</div>

<style>
	.world-node {
		background: transparent;
	}
</style>

