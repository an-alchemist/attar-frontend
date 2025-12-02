<script lang="ts">
	import type { MemoryEntry } from '$lib/stores/memory';
	
	type Props = {
		memories: MemoryEntry[];
		selectedId?: string | null;
		onSelect?: (memory: MemoryEntry) => void;
		onClose?: () => void;
	};
	
	let { memories, selectedId = null, onSelect, onClose }: Props = $props();
	
	let internalSelectedId = $state<string | null>(null);
	
	$effect(() => {
		if (selectedId !== undefined) {
			internalSelectedId = selectedId;
		}
	});
	
	const selectedMemory = $derived(
		memories.find(m => m.id === internalSelectedId) || null
	);
	
	function selectMemory(memory: MemoryEntry) {
		internalSelectedId = memory.id;
		onSelect?.(memory);
	}
	
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
	
	// Count themes and ideas
	function getThemeCount(memory: MemoryEntry): number {
		return memory.newKnowledge.filter(k => k.type === 'theme').length;
	}
	
	function getIdeaCount(memory: MemoryEntry): number {
		return memory.newKnowledge.filter(k => k.type === 'idea').length;
	}
</script>

<div class="memory-reader flex h-full w-full" style="font-family: 'JetBrains Mono', monospace;">
	<!-- Sidebar - Memory list -->
	<div class="memory-sidebar flex flex-col shrink-0" style="width: 320px; background: rgba(0,0,0,0.3); border-right: 1px solid rgba(120, 110, 130, 0.3);">
		<!-- Sidebar header -->
		<div class="px-4 py-3 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.2);">
			<div class="text-sm" style="color: rgba(200, 230, 180, 0.9);">
				Memory Archive
			</div>
			<div class="text-xs mt-1" style="color: rgba(200, 230, 180, 0.5);">
				{memories.length} days recorded
			</div>
		</div>
		
		<!-- Memory list -->
		<div class="flex-1 overflow-y-auto" style="scrollbar-width: thin; scrollbar-color: rgba(147, 112, 219, 0.3) transparent;">
			{#each memories as memory (memory.id)}
				<button
					onclick={() => selectMemory(memory)}
					class="w-full text-left p-3 transition-all border-b"
					style="
						background: {internalSelectedId === memory.id ? 'rgba(147, 112, 219, 0.15)' : 'transparent'};
						border-left: 3px solid {internalSelectedId === memory.id ? 'rgba(147, 112, 219, 0.6)' : 'transparent'};
						border-bottom-color: rgba(120, 110, 130, 0.15);
					"
				>
					<div class="flex items-start gap-3">
						<!-- Color square -->
						<div 
							class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs"
							style="background: {getColorForDay(memory.day)}; color: rgba(255,255,255,0.9);"
						>
							{memory.day}
						</div>
						
						<!-- Content preview -->
						<div class="flex-1 min-w-0">
							<div class="text-xs truncate" style="color: {internalSelectedId === memory.id ? 'rgba(220, 210, 255, 0.95)' : 'rgba(200, 230, 180, 0.8)'};">
								{memory.envTitle || `Day ${memory.day}`}
							</div>
							{#if memory.identity}
								<div class="text-xs mt-1 truncate" style="color: rgba(200, 230, 180, 0.5);">
									{memory.identity.slice(0, 50)}...
								</div>
							{/if}
							<div class="flex items-center gap-3 mt-1.5">
								{#if memory.newKnowledge.length > 0}
									<span class="text-xs" style="color: rgba(100, 149, 237, 0.7);">
										⬡ {memory.newKnowledge.length}
									</span>
								{/if}
								{#if memory.interactions.length > 0}
									<span class="text-xs" style="color: rgba(72, 209, 204, 0.7);">
										◇ {memory.interactions.length}
									</span>
								{/if}
							</div>
						</div>
					</div>
				</button>
			{/each}
			
			{#if memories.length === 0}
				<div class="flex items-center justify-center h-full p-8">
					<div class="text-center">
						<div class="text-2xl mb-2" style="opacity: 0.3;">◈</div>
						<div class="text-xs" style="color: rgba(200, 230, 180, 0.4);">No memories yet</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Main content - Selected memory -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
		{#if selectedMemory}
			<!-- Memory header -->
			<div class="px-6 py-4 shrink-0 flex items-center justify-between" style="background: linear-gradient(180deg, rgba(147, 112, 219, 0.1) 0%, transparent 100%); border-bottom: 1px solid rgba(120, 110, 130, 0.2);">
				<div class="flex items-center gap-4 min-w-0">
					<!-- Day badge -->
					<div 
						class="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg text-base"
						style="background: {getColorForDay(selectedMemory.day)}; color: rgba(255,255,255,0.95);"
					>
						{selectedMemory.day}
					</div>
					<div class="min-w-0">
						<h2 class="text-base" style="color: rgba(220, 210, 255, 0.95);">
							{selectedMemory.envTitle || `Day ${selectedMemory.day}`}
						</h2>
						<div class="text-xs mt-1" style="color: rgba(200, 230, 180, 0.5);">
							{getThemeCount(selectedMemory)} themes · {getIdeaCount(selectedMemory)} ideas · {selectedMemory.interactions.length} voices
						</div>
					</div>
				</div>
				
				{#if onClose}
					<button 
						onclick={onClose}
						class="shrink-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/10" 
						style="border: 1px solid rgba(200, 230, 180, 0.3); color: rgba(200, 230, 180, 0.6);"
					>
						<span style="font-size: 18px;">×</span>
					</button>
				{/if}
			</div>
			
			<!-- Memory content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6" style="scrollbar-width: thin; scrollbar-color: rgba(147, 112, 219, 0.3) transparent;">
				<!-- Identity Section -->
				{#if selectedMemory.identity}
					<div class="memory-section">
						<div class="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider" style="color: rgba(200, 230, 180, 0.6);">
							<span style="color: rgba(147, 112, 219, 0.8);">◈</span>
							<span>Identity</span>
						</div>
						<p class="text-sm leading-relaxed pl-3" style="color: rgba(220, 210, 255, 0.85); border-left: 2px solid rgba(147, 112, 219, 0.4); font-style: italic;">
							"{selectedMemory.identity}"
						</p>
					</div>
				{/if}
				
				<!-- Themes Section -->
				{@const themes = selectedMemory.newKnowledge.filter(k => k.type === 'theme')}
				{#if themes.length > 0}
					<div class="memory-section">
						<div class="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider" style="color: rgba(200, 230, 180, 0.6);">
							<span style="color: rgba(100, 149, 237, 0.8);">⬡</span>
							<span>Themes Learned</span>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each themes as theme}
								<span 
									class="px-3 py-1 rounded-full text-xs"
									style="background: rgba(100, 149, 237, 0.15); border: 1px solid rgba(100, 149, 237, 0.3); color: rgba(180, 200, 255, 0.9);"
								>
									{theme.value}
								</span>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Ideas Section -->
				{@const ideas = selectedMemory.newKnowledge.filter(k => k.type === 'idea')}
				{#if ideas.length > 0}
					<div class="memory-section">
						<div class="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider" style="color: rgba(200, 230, 180, 0.6);">
							<span style="color: rgba(255, 218, 185, 0.8);">✦</span>
							<span>Ideas Absorbed</span>
						</div>
						<div class="space-y-2">
							{#each ideas as idea}
								<div 
									class="px-3 py-2 rounded-lg text-sm"
									style="background: rgba(255, 218, 185, 0.08); border-left: 2px solid rgba(255, 218, 185, 0.3); color: rgba(255, 218, 185, 0.9);"
								>
									"{idea.value}"
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Interactions Section (Pseudonyms) -->
				{#if selectedMemory.interactions.length > 0}
					<div class="memory-section">
						<div class="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider" style="color: rgba(200, 230, 180, 0.6);">
							<span style="color: rgba(72, 209, 204, 0.8);">◇</span>
							<span>Voices Heard ({selectedMemory.interactions.length})</span>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each selectedMemory.interactions as pseudonym}
								<span 
									class="px-3 py-1.5 rounded text-xs"
									style="background: rgba(72, 209, 204, 0.1); border: 1px solid rgba(72, 209, 204, 0.25); color: rgba(72, 209, 204, 0.9);"
								>
									{pseudonym}
								</span>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Environment Section -->
				{#if selectedMemory.envImageUrl || selectedMemory.envDescription}
					<div class="memory-section">
						<div class="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider" style="color: rgba(200, 230, 180, 0.6);">
							<span style="color: rgba(255, 182, 193, 0.8);">◐</span>
							<span>World State</span>
						</div>
						{#if selectedMemory.envImageUrl}
							<div class="w-full h-40 rounded-lg overflow-hidden mb-3" style="border: 1px solid rgba(120, 110, 130, 0.3);">
								{#if selectedMemory.envVideoUrl}
									<video 
										src={selectedMemory.envVideoUrl} 
										class="w-full h-full object-cover"
										autoplay
										loop
										muted
										playsinline
									/>
								{:else}
									<img 
										src={selectedMemory.envImageUrl} 
										alt="World state" 
										class="w-full h-full object-cover"
									/>
								{/if}
							</div>
						{/if}
						{#if selectedMemory.envDescription}
							<p class="text-sm leading-relaxed" style="color: rgba(200, 230, 180, 0.7);">
								{selectedMemory.envDescription}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<!-- No selection state -->
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center">
					<div class="text-4xl mb-4" style="opacity: 0.2;">◈</div>
					<div class="text-sm" style="color: rgba(200, 230, 180, 0.4);">
						Select a memory to explore
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.memory-sidebar ::-webkit-scrollbar {
		width: 4px;
	}
	
	.memory-sidebar ::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.memory-sidebar ::-webkit-scrollbar-thumb {
		background: rgba(147, 112, 219, 0.3);
		border-radius: 2px;
	}
	
	.memory-section {
		padding-bottom: 20px;
		border-bottom: 1px solid rgba(120, 110, 130, 0.15);
	}
	
	.memory-section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
</style>
