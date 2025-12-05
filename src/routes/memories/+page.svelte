<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getMemories, type MemoryEntry } from '$lib/stores/memory';
	import { isMobile } from '$lib/stores/mobile';
	
	let memories = $state<MemoryEntry[]>([]);
	let loading = $state(true);
	let selectedId = $state<string | null>(null);
	let showSidebar = $state(true);
	
	// Mobile view state: 'list' or 'detail'
	let mobileView = $state<'list' | 'detail'>('list');
	
	const selectedMemory = $derived(memories.find(m => m.id === selectedId) || null);
	
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
	
	function getThemeCount(memory: MemoryEntry): number {
		return memory.newKnowledge.filter(k => k.type === 'theme').length;
	}
	
	function getIdeaCount(memory: MemoryEntry): number {
		return memory.newKnowledge.filter(k => k.type === 'idea').length;
	}
	
	onMount(async () => {
		memories = await getMemories();
		loading = false;
		
		// Check for pre-selected memory from URL
		const urlSelectedId = $page.url.searchParams.get('selected');
		if (urlSelectedId && memories.some(m => m.id === urlSelectedId)) {
			selectedId = urlSelectedId;
			if ($isMobile) mobileView = 'detail';
		} else if (memories.length > 0 && !$isMobile) {
			// Auto-select first memory if available (desktop only)
			selectedId = memories[0].id;
		}
	});
	
	function goBack() {
		// On mobile detail view, go back to list first
		if ($isMobile && mobileView === 'detail') {
			mobileView = 'list';
			return;
		}
		goto('/');
	}
	
	function selectMemory(memory: MemoryEntry) {
		selectedId = memory.id;
		// On mobile, switch to detail view
		if ($isMobile) {
			mobileView = 'detail';
		} else if (window.innerWidth < 768) {
			showSidebar = false;
		}
	}
	
	function toggleSidebar() {
		showSidebar = !showSidebar;
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			goBack();
		}
	}
</script>

<svelte:head>
	<title>Memory Archive - Attar</title>
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
				<span class="title">Memory.att</span>
				<span class="subtitle">{memories.length} days recorded</span>
			</div>
		</div>
		<div class="top-bar-right">
			<span class="archive-badge">Full Archive</span>
		</div>
	</div>

	<!-- Mobile View -->
	{#if $isMobile}
		<div class="mobile-content">
			{#if loading}
				<div class="center-message">
					<div class="icon">◈</div>
					<p>Loading memories...</p>
				</div>
			{:else if memories.length === 0}
				<div class="center-message">
					<div class="icon">◈</div>
					<h2>No memories yet</h2>
					<p>The memory archive will begin when the entity starts recording its experiences.</p>
					<button onclick={goBack} class="cta-btn">← Return to World</button>
				</div>
			{:else if mobileView === 'list'}
				<!-- Mobile List View -->
				<div class="mobile-list">
					{#each memories as memory (memory.id)}
						<button
							onclick={() => selectMemory(memory)}
							class="mobile-list-item"
						>
							<div 
								class="day-badge"
								style="background: {getColorForDay(memory.day)};"
							>
								{memory.day}
							</div>
							<div class="item-info">
								<span class="item-title">{memory.envTitle || `Day ${memory.day}`}</span>
								{#if memory.identity}
									<span class="item-preview">{memory.identity.slice(0, 50)}...</span>
								{/if}
								<div class="item-meta">
									{#if memory.newKnowledge.length > 0}
										<span>⬡ {memory.newKnowledge.length}</span>
									{/if}
									{#if memory.interactions.length > 0}
										<span>◇ {memory.interactions.length}</span>
									{/if}
								</div>
							</div>
							<span class="chevron">›</span>
						</button>
					{/each}
				</div>
			{:else if mobileView === 'detail' && selectedMemory}
				<!-- Mobile Detail View -->
				<div class="mobile-detail">
					<div class="mobile-detail-header">
						<div 
							class="memory-badge"
							style="background: {getColorForDay(selectedMemory.day)};"
						>
							{selectedMemory.day}
						</div>
						<div class="memory-info">
							<h2>{selectedMemory.envTitle || `Day ${selectedMemory.day}`}</h2>
							<span class="memory-meta">
								{getThemeCount(selectedMemory)} themes · {getIdeaCount(selectedMemory)} ideas · {selectedMemory.interactions.length} voices
							</span>
						</div>
					</div>
					
					<div class="mobile-detail-content">
						<!-- Identity Section -->
						{#if selectedMemory.identity}
							<div class="section">
								<div class="section-header">
									<span class="section-icon" style="color: rgba(147, 112, 219, 0.8);">◈</span>
									<span>Identity</span>
								</div>
								<p class="identity-text">"{selectedMemory.identity}"</p>
							</div>
						{/if}
						
						<!-- Themes Section -->
						{#if selectedMemory.newKnowledge.filter(k => k.type === 'theme').length > 0}
							{@const themes = selectedMemory.newKnowledge.filter(k => k.type === 'theme')}
							<div class="section">
								<div class="section-header">
									<span class="section-icon" style="color: rgba(100, 149, 237, 0.8);">⬡</span>
									<span>Themes Learned</span>
								</div>
								<div class="tags">
									{#each themes as theme}
										<span class="tag knowledge">{theme.value}</span>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- Ideas Section -->
						{#if selectedMemory.newKnowledge.filter(k => k.type === 'idea').length > 0}
							{@const ideas = selectedMemory.newKnowledge.filter(k => k.type === 'idea')}
							<div class="section">
								<div class="section-header">
									<span class="section-icon" style="color: rgba(255, 218, 185, 0.8);">✦</span>
									<span>Ideas Absorbed</span>
								</div>
								<div class="ideas-list">
									{#each ideas as idea}
										<div class="idea-item">"{idea.value}"</div>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- Interactions Section (Pseudonyms) -->
						{#if selectedMemory.interactions.length > 0}
							<div class="section">
								<div class="section-header">
									<span class="section-icon" style="color: rgba(72, 209, 204, 0.8);">◇</span>
									<span>Voices Heard ({selectedMemory.interactions.length})</span>
								</div>
								<div class="tags">
									{#each selectedMemory.interactions as pseudonym}
										<span class="tag person">{pseudonym}</span>
									{/each}
								</div>
							</div>
						{/if}
						
						<!-- Environment Section -->
						{#if selectedMemory.envImageUrl || selectedMemory.envDescription}
							<div class="section">
								<div class="section-header">
									<span class="section-icon" style="color: rgba(255, 182, 193, 0.8);">◐</span>
									<span>World State</span>
								</div>
								{#if selectedMemory.envImageUrl}
									<div class="env-image">
										{#if selectedMemory.envVideoUrl}
											<video src={selectedMemory.envVideoUrl} autoplay loop muted playsinline crossorigin="anonymous" />
										{:else}
											<img src={selectedMemory.envImageUrl} alt="World state" />
										{/if}
									</div>
								{/if}
								{#if selectedMemory.envDescription}
									<p class="env-desc">{selectedMemory.envDescription}</p>
								{/if}
							</div>
						{/if}
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
						{:else if memories.length === 0}
							<div class="sidebar-empty">
								<span class="empty-icon">◈</span>
								<span>No memories yet</span>
							</div>
						{:else}
							{#each memories as memory (memory.id)}
								<button
									onclick={() => selectMemory(memory)}
									class="sidebar-item"
									class:active={selectedId === memory.id}
								>
									<div 
										class="day-badge"
										style="background: {getColorForDay(memory.day)};"
									>
										{memory.day}
									</div>
									<div class="item-info">
										<span class="item-title">{memory.envTitle || `Day ${memory.day}`}</span>
										{#if memory.identity}
											<span class="item-preview">{memory.identity.slice(0, 40)}...</span>
										{/if}
										<div class="item-meta">
											{#if memory.newKnowledge.length > 0}
												<span>⬡ {memory.newKnowledge.length}</span>
											{/if}
											{#if memory.interactions.length > 0}
												<span>◇ {memory.interactions.length}</span>
											{/if}
										</div>
									</div>
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Main content -->
			<div class="main-area">
				{#if loading}
					<div class="center-message">
						<div class="icon">◈</div>
						<p>Loading memories...</p>
					</div>
				{:else if memories.length === 0}
					<div class="center-message">
						<div class="icon">◈</div>
						<h2>No memories yet</h2>
						<p>The memory archive will begin when the entity starts recording its experiences.</p>
						<button onclick={goBack} class="cta-btn">← Return to World</button>
					</div>
				{:else if selectedMemory}
					<div class="memory-view">
						<!-- Memory header -->
						<div class="memory-header">
							<div 
								class="memory-badge"
								style="background: {getColorForDay(selectedMemory.day)};"
							>
								{selectedMemory.day}
							</div>
							<div class="memory-info">
								<h2>{selectedMemory.envTitle || `Day ${selectedMemory.day}`}</h2>
								<span class="memory-meta">
									{getThemeCount(selectedMemory)} themes · {getIdeaCount(selectedMemory)} ideas · {selectedMemory.interactions.length} voices
								</span>
							</div>
						</div>
						
						<!-- Memory content -->
						<div class="memory-content">
							<!-- Identity Section -->
							{#if selectedMemory.identity}
								<div class="section">
									<div class="section-header">
										<span class="section-icon" style="color: rgba(147, 112, 219, 0.8);">◈</span>
										<span>Identity</span>
									</div>
									<p class="identity-text">"{selectedMemory.identity}"</p>
								</div>
							{/if}
							
							<!-- Themes Section -->
							{#if selectedMemory.newKnowledge.filter(k => k.type === 'theme').length > 0}
								{@const themes = selectedMemory.newKnowledge.filter(k => k.type === 'theme')}
								<div class="section">
									<div class="section-header">
										<span class="section-icon" style="color: rgba(100, 149, 237, 0.8);">⬡</span>
										<span>Themes Learned</span>
									</div>
									<div class="tags">
										{#each themes as theme}
											<span class="tag knowledge">{theme.value}</span>
										{/each}
									</div>
								</div>
							{/if}
							
							<!-- Ideas Section -->
							{#if selectedMemory.newKnowledge.filter(k => k.type === 'idea').length > 0}
								{@const ideas = selectedMemory.newKnowledge.filter(k => k.type === 'idea')}
								<div class="section">
									<div class="section-header">
										<span class="section-icon" style="color: rgba(255, 218, 185, 0.8);">✦</span>
										<span>Ideas Absorbed</span>
									</div>
									<div class="ideas-list">
										{#each ideas as idea}
											<div class="idea-item">"{idea.value}"</div>
										{/each}
									</div>
								</div>
							{/if}
							
							<!-- Interactions Section (Pseudonyms) -->
							{#if selectedMemory.interactions.length > 0}
								<div class="section">
									<div class="section-header">
										<span class="section-icon" style="color: rgba(72, 209, 204, 0.8);">◇</span>
										<span>Voices Heard ({selectedMemory.interactions.length})</span>
									</div>
									<div class="tags">
										{#each selectedMemory.interactions as pseudonym}
											<span class="tag person">{pseudonym}</span>
										{/each}
									</div>
								</div>
							{/if}
							
							<!-- Environment Section -->
							{#if selectedMemory.envImageUrl || selectedMemory.envDescription}
								<div class="section">
									<div class="section-header">
										<span class="section-icon" style="color: rgba(255, 182, 193, 0.8);">◐</span>
										<span>World State</span>
									</div>
									{#if selectedMemory.envImageUrl}
										<div class="env-image">
											{#if selectedMemory.envVideoUrl}
												<video src={selectedMemory.envVideoUrl} autoplay loop muted playsinline crossorigin="anonymous" />
											{:else}
												<img src={selectedMemory.envImageUrl} alt="World state" />
											{/if}
										</div>
									{/if}
									{#if selectedMemory.envDescription}
										<p class="env-desc">{selectedMemory.envDescription}</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div class="center-message">
						<div class="icon">◈</div>
						<p>Select a memory to explore</p>
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
	
	.archive-badge {
		padding: 6px 12px;
		font-size: 11px;
		color: rgba(200, 200, 255, 0.8);
		background: rgba(147, 112, 219, 0.15);
		border: 1px solid rgba(147, 112, 219, 0.3);
		border-radius: 12px;
	}
	
	.content-area {
		flex: 1;
		display: flex;
		min-height: 0;
		overflow: hidden;
	}
	
	.sidebar {
		width: 300px;
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
		scrollbar-color: rgba(147, 112, 219, 0.3) transparent;
	}
	
	.sidebar-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 40px 20px;
		text-align: center;
		color: rgba(200, 230, 180, 0.5);
		font-size: 12px;
	}
	
	.empty-icon {
		font-size: 32px;
		opacity: 0.5;
	}
	
	.sidebar-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		width: 100%;
		padding: 14px 16px;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(120, 110, 130, 0.1);
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}
	
	.sidebar-item:hover {
		background: rgba(147, 112, 219, 0.05);
	}
	
	.sidebar-item.active {
		background: rgba(147, 112, 219, 0.1);
		border-left: 3px solid rgba(147, 112, 219, 0.6);
	}
	
	.day-badge {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
		flex-shrink: 0;
	}
	
	.item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.item-title {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.item-preview {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.5);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.item-meta {
		display: flex;
		gap: 12px;
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
		margin-top: 4px;
	}
	
	.main-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}
	
	.center-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: rgba(200, 230, 180, 0.5);
		padding: 20px;
	}
	
	.center-message .icon {
		font-size: 48px;
		opacity: 0.3;
		margin-bottom: 16px;
	}
	
	.center-message h2 {
		font-size: 18px;
		color: rgba(220, 210, 255, 0.7);
		margin-bottom: 8px;
	}
	
	.center-message p {
		font-size: 13px;
		max-width: 300px;
		margin-bottom: 20px;
	}
	
	.cta-btn {
		padding: 12px 24px;
		font-size: 13px;
		color: rgba(200, 200, 255, 0.95);
		background: rgba(147, 112, 219, 0.15);
		border: 1px solid rgba(147, 112, 219, 0.4);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.cta-btn:hover {
		background: rgba(147, 112, 219, 0.25);
	}
	
	.memory-view {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	.memory-header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
		background: linear-gradient(180deg, rgba(147, 112, 219, 0.1) 0%, transparent 100%);
		border-bottom: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.memory-badge {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		font-size: 16px;
		color: rgba(255, 255, 255, 0.95);
	}
	
	.memory-info {
		flex: 1;
		min-width: 0;
	}
	
	.memory-info h2 {
		font-size: 16px;
		color: rgba(220, 210, 255, 0.95);
		margin-bottom: 4px;
	}
	
	.memory-meta {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.5);
	}
	
	.memory-content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		scrollbar-width: thin;
		scrollbar-color: rgba(147, 112, 219, 0.3) transparent;
	}
	
	.section {
		padding-bottom: 20px;
		margin-bottom: 20px;
		border-bottom: 1px solid rgba(120, 110, 130, 0.15);
	}
	
	.section:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
	
	.section-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: rgba(200, 230, 180, 0.6);
	}
	
	.section-icon {
		font-size: 12px;
	}
	
	.identity-text {
		font-size: 14px;
		line-height: 1.6;
		color: rgba(220, 210, 255, 0.85);
		font-style: italic;
		padding-left: 12px;
		border-left: 2px solid rgba(147, 112, 219, 0.4);
	}
	
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	
	.tag {
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
	}
	
	.tag.knowledge {
		background: rgba(100, 149, 237, 0.15);
		border: 1px solid rgba(100, 149, 237, 0.3);
		color: rgba(180, 200, 255, 0.9);
	}
	
	.tag.person {
		background: rgba(72, 209, 204, 0.1);
		border: 1px solid rgba(72, 209, 204, 0.25);
		color: rgba(72, 209, 204, 0.9);
	}
	
	.ideas-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.idea-item {
		padding: 10px 14px;
		font-size: 13px;
		line-height: 1.5;
		color: rgba(255, 218, 185, 0.9);
		background: rgba(255, 218, 185, 0.08);
		border-left: 2px solid rgba(255, 218, 185, 0.3);
		border-radius: 0 6px 6px 0;
	}
	
	.env-image {
		width: 100%;
		height: 160px;
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 12px;
		border: 1px solid rgba(120, 110, 130, 0.3);
	}
	
	.env-image img,
	.env-image video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.env-desc {
		font-size: 13px;
		line-height: 1.5;
		color: rgba(200, 230, 180, 0.7);
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
		
		.memory-header {
			padding: 16px;
		}
		
		.memory-content {
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
		background: rgba(147, 112, 219, 0.08);
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
	}
	
	.mobile-list-item .item-preview {
		font-size: 12px;
		-webkit-line-clamp: 2;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.mobile-list-item .item-meta {
		margin-top: 6px;
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
	
	.mobile-detail-header {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 20px;
		background: linear-gradient(180deg, rgba(147, 112, 219, 0.1) 0%, transparent 100%);
		border-bottom: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.mobile-detail-header .memory-badge {
		width: 52px;
		height: 52px;
		font-size: 18px;
	}
	
	.mobile-detail-header .memory-info h2 {
		font-size: 16px;
		margin-bottom: 4px;
	}
	
	.mobile-detail-header .memory-meta {
		font-size: 11px;
	}
	
	.mobile-detail-content {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 20px;
	}
	
	.mobile-detail-content .section {
		padding-bottom: 20px;
		margin-bottom: 20px;
		border-bottom: 1px solid rgba(120, 110, 130, 0.15);
	}
	
	.mobile-detail-content .section:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
	
	.mobile-detail-content .env-image {
		height: auto;
		max-height: 200px;
	}
</style>
