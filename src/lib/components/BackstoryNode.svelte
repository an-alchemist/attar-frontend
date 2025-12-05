<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { getBackstory, type BackstoryEntry } from '$lib/stores/backstory';
	import { getTimelineEntries, type TimelineEntry } from '$lib/stores/timeline';
	
	type BackstoryNodeData = {
		label?: string;
		image?: string;
	};
	
	let { data }: NodeProps<BackstoryNodeData> = $props();
	
	const entityImage = $derived(data.image || '/worlds/be.png');
	
	let backstory = $state<BackstoryEntry[]>([]);
	let timeline = $state<TimelineEntry[]>([]);
	let loading = $state(true);
	
	let showPopup = $state(false);
	let portalEl: HTMLDivElement | null = null;
	
	const latestEntry = $derived(backstory.length > 0 ? backstory[backstory.length - 1] : { day: 0, text: 'Loading...', reasoning: null });
	
	// Map day to timeline entry for images
	function getImageForDay(day: number): string {
		const entry = timeline.find(t => t.day === day);
		return entry?.worldImageUrl || entry?.entityImageUrl || entityImage;
	}
	
	onMount(async () => {
		// Create portal element attached to body
		portalEl = document.createElement('div');
		portalEl.id = 'backstory-portal-' + Math.random().toString(36).slice(2);
		document.body.appendChild(portalEl);
		
		// Fetch backstory and timeline data
		const [backstoryData, timelineData] = await Promise.all([
			getBackstory(),
			getTimelineEntries()
		]);
		backstory = backstoryData;
		timeline = timelineData;
		loading = false;
		
		return () => {
			if (portalEl) {
				portalEl.remove();
			}
		};
	});
	
	function openBackstory() {
		showPopup = true;
		renderPortal();
	}
	
	function closePopup() {
		showPopup = false;
		renderPortal();
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && showPopup) {
			closePopup();
		}
	}
	
	function renderPortal() {
		if (!portalEl) return;
		
		if (!showPopup) {
			portalEl.innerHTML = '';
			document.removeEventListener('keydown', handleKeydown);
			return;
		}
		
		document.addEventListener('keydown', handleKeydown);
		
		const entriesHtml = backstory.map(entry => {
			const imgUrl = getImageForDay(entry.day);
			return `
			<div class="backstory-entry">
				<div class="backstory-entry-image">
					<img src="${imgUrl}" alt="Day ${entry.day}" />
				</div>
				<div class="backstory-entry-content">
					<span class="backstory-day">day #${entry.day}</span>
					<span class="backstory-text">${entry.text}</span>
					${entry.reasoning ? `<span class="backstory-reasoning">${entry.reasoning}</span>` : ''}
				</div>
			</div>
		`}).join('');
		
		portalEl.innerHTML = `
			<div class="backstory-overlay" id="backstory-overlay">
				<div class="backstory-modal" id="backstory-modal">
					<div class="backstory-modal-header">
						<div style="display: flex; align-items: center; gap: 16px;">
							<div style="width: 48px; height: 48px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(200, 230, 180, 0.3); box-shadow: 0 0 15px rgba(200, 230, 180, 0.2); flex-shrink: 0;">
								<img src="${entityImage}" alt="Entity" style="width: 100%; height: 100%; object-fit: cover;" />
							</div>
							<div>
								<div style="font-size: 16px; color: rgba(200, 230, 180, 0.9);">
									Backstory.att
								</div>
								<div style="font-size: 12px; margin-top: 2px; color: rgba(200, 230, 180, 0.5);">
									${backstory.length} days logged
								</div>
							</div>
						</div>
						<button class="backstory-close-btn" id="backstory-close">
							<span style="font-size: 18px;">×</span>
						</button>
					</div>
					
					<div class="backstory-modal-content">
						${entriesHtml}
						
						<div style="display: flex; align-items: center; gap: 8px; padding-top: 16px; margin-top: 8px; border-top: 1px solid rgba(200, 230, 180, 0.1);">
							<span style="color: rgba(200, 230, 180, 0.4);">></span>
							<span class="backstory-cursor"></span>
							<span style="font-size: 14px; margin-left: 8px; color: rgba(200, 230, 180, 0.3);">awaiting next chapter...</span>
						</div>
					</div>
					
					<div class="backstory-modal-footer">
						<span style="font-size: 14px; color: rgba(200, 230, 180, 0.4);">
							The story of an evolving consciousness
						</span>
						<button class="backstory-footer-btn" id="backstory-close-footer">
							Close
						</button>
					</div>
				</div>
			</div>
		`;
		
		// Add event listeners
		const overlay = portalEl.querySelector('#backstory-overlay');
		const modal = portalEl.querySelector('#backstory-modal');
		const closeBtn = portalEl.querySelector('#backstory-close');
		const closeFooterBtn = portalEl.querySelector('#backstory-close-footer');
		
		overlay?.addEventListener('click', (e) => {
			if (e.target === overlay) closePopup();
		});
		closeBtn?.addEventListener('click', closePopup);
		closeFooterBtn?.addEventListener('click', closePopup);
		modal?.addEventListener('click', (e) => e.stopPropagation());
	}
</script>

<!-- Font loaded in app.html -->

<div class="backstory-node flex flex-col w-full h-full rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
	<Handle type="target" position={Position.Left} id="center" class="!opacity-0 !w-1 !h-1" style="top: 50%; left: 50%;" />
	
	<!-- Terminal header -->
	<div class="flex items-center justify-between px-3 py-2 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
		<div class="flex items-center gap-2">
			<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8);">
				Backstory.att
			</span>
		</div>
		<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.5);">
			{#if loading}
				loading...
			{:else}
				{backstory.length} entries
			{/if}
		</span>
	</div>
	
	<!-- Terminal content - entity image + latest entry -->
	<div class="flex-1 p-3 flex items-center gap-3 min-h-0" style="background: rgba(0,0,0,0.15);">
		<!-- Entity portrait -->
		<div class="shrink-0">
			<div class="entity-portrait" style="width: 56px; height: 56px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(200, 230, 180, 0.3); box-shadow: 0 0 12px rgba(200, 230, 180, 0.15);">
				<img src={entityImage} alt="Entity" class="w-full h-full object-cover" />
			</div>
		</div>
		
		<!-- Latest entry -->
		<div class="flex-1 min-w-0" style="font-family: 'JetBrains Mono', monospace;">
			{#if loading}
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">
					Loading backstory...
				</span>
			{:else}
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">
					day #{latestEntry.day}:
				</span>
				<p class="text-sm mt-1 leading-relaxed line-clamp-2" style="color: rgba(200, 230, 180, 0.85);">
					"{latestEntry.text}"
				</p>
			{/if}
			<!-- Blinking cursor -->
			<div class="mt-2 flex items-center gap-1">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.4);">></span>
				<span class="w-1.5 h-3 animate-pulse" style="background: rgba(200, 230, 180, 0.6);"></span>
			</div>
		</div>
	</div>
	
	<!-- Footer with open button -->
	<div class="px-3 py-2 shrink-0 flex items-center justify-between" style="background: rgba(0,0,0,0.2); border-top: 1px solid rgba(120, 110, 130, 0.2);">
		<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.4);">
			{#if !loading}
				day #{latestEntry.day}
			{/if}
		</span>
		<button
			onclick={openBackstory}
			disabled={loading}
			class="text-xs px-2 py-1 rounded transition-all hover:scale-105"
			style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8); border: 1px solid rgba(200, 230, 180, 0.3); background: rgba(200, 230, 180, 0.1);"
		>
			View All
		</button>
	</div>
</div>

<style>
	.backstory-node {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
	
	/* Portal popup styles - must be global since portal is outside component */
	:global(.backstory-overlay) {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		font-family: 'JetBrains Mono', monospace;
	}
	
	:global(.backstory-modal) {
		background: linear-gradient(145deg, rgba(35, 30, 45, 0.98) 0%, rgba(20, 18, 28, 1) 100%);
		border: 1px solid rgba(120, 110, 130, 0.5);
		border-radius: 12px;
		width: 90vw;
		max-width: 800px;
		height: 80vh;
		max-height: 700px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
	}
	
	:global(.backstory-modal-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 24px;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(120, 110, 130, 0.3);
		flex-shrink: 0;
	}
	
	:global(.backstory-close-btn) {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		border: 1px solid rgba(200, 230, 180, 0.3);
		color: rgba(200, 230, 180, 0.6);
		background: transparent;
		cursor: pointer;
		transition: background 0.2s;
	}
	
	:global(.backstory-close-btn:hover) {
		background: rgba(255, 255, 255, 0.1);
	}
	
	:global(.backstory-modal-content) {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		min-height: 0;
		scrollbar-width: thin;
		scrollbar-color: rgba(200, 230, 180, 0.3) transparent;
	}
	
	:global(.backstory-modal-content::-webkit-scrollbar) {
		width: 8px;
	}
	
	:global(.backstory-modal-content::-webkit-scrollbar-track) {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}
	
	:global(.backstory-modal-content::-webkit-scrollbar-thumb) {
		background: rgba(200, 230, 180, 0.3);
		border-radius: 4px;
	}
	
	:global(.backstory-modal-content::-webkit-scrollbar-thumb:hover) {
		background: rgba(200, 230, 180, 0.5);
	}
	
	:global(.backstory-entry) {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 12px 16px;
		margin-bottom: 12px;
		background: rgba(0, 0, 0, 0.25);
		border-left: 3px solid rgba(200, 230, 180, 0.3);
		border-radius: 4px;
		transition: all 0.2s ease;
	}
	
	:global(.backstory-entry:hover) {
		background: rgba(0, 0, 0, 0.35);
		border-left-color: rgba(200, 230, 180, 0.6);
	}
	
	:global(.backstory-entry-image) {
		width: 64px;
		height: 64px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		border: 1px solid rgba(200, 230, 180, 0.2);
	}
	
	:global(.backstory-entry-image img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	:global(.backstory-entry-content) {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	
	:global(.backstory-day) {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.5);
		white-space: nowrap;
	}
	
	:global(.backstory-text) {
		font-size: 15px;
		color: rgba(200, 230, 180, 0.9);
		line-height: 1.5;
	}
	
	:global(.backstory-reasoning) {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.45);
		font-style: italic;
		line-height: 1.4;
	}
	
	:global(.backstory-cursor) {
		width: 10px;
		height: 20px;
		background: rgba(200, 230, 180, 0.6);
		animation: blink 1s infinite;
	}
	
	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}
	
	:global(.backstory-modal-footer) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 24px;
		background: rgba(0, 0, 0, 0.25);
		border-top: 1px solid rgba(120, 110, 130, 0.2);
		flex-shrink: 0;
	}
	
	:global(.backstory-footer-btn) {
		font-size: 14px;
		padding: 8px 16px;
		border-radius: 4px;
		color: rgba(200, 230, 180, 0.8);
		border: 1px solid rgba(200, 230, 180, 0.3);
		background: transparent;
		cursor: pointer;
		transition: background 0.2s;
	}
	
	:global(.backstory-footer-btn:hover) {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
