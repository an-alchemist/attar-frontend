<script lang="ts">
	import type { NodeProps } from '@xyflow/svelte';
	
	type ImageNodeData = {
		label?: string;
		image?: string;
		type?: string;
	};
	
	let { data }: NodeProps<ImageNodeData> = $props();
</script>

<div class="image-node-card relative w-full h-full rounded-xl overflow-hidden">
	<div class="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer w-full h-full relative z-10" style="border: 0.5px solid rgb(229, 231, 235);">
		{#if data.image}
			<div class="relative w-full h-full">
				<img src={data.image} alt={data.label || 'Node image'} class="w-full h-full object-cover" />
				{#if data.type}
					<div class="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
						{data.type}
					</div>
				{/if}
				{#if data.label}
					<div class="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
						{data.label}
					</div>
				{/if}
			</div>
		{:else}
			<div class="w-full h-full flex items-center justify-center bg-white">
				<div class="text-sm font-medium text-gray-400">No content</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.image-node-card) {
		position: relative;
	}
	
	:global(.image-node-card::before) {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: inherit;
		background: conic-gradient(
			from 0deg,
			transparent 0deg,
			transparent 270deg,
			rgba(59, 130, 246, 0.8) 300deg,
			rgba(59, 130, 246, 1) 320deg,
			rgba(59, 130, 246, 0.8) 340deg,
			transparent 360deg
		);
		animation: rotate-blue-border 3s linear infinite;
		z-index: 0;
		pointer-events: none;
	}
	
	@keyframes rotate-blue-border {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>

