<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { getPublishedLetters, voteOnLetter, type VoteResult } from '$lib/stores/mailbox';
	import { isAuthenticated, profile } from '$lib/stores/auth';
	import type { AttarMailbox } from '$lib/supabase';
	import MoonVoter from './MoonVoter.svelte';
	
	type MailboxNodeData = {
		label?: string;
	};
	
	let { data }: NodeProps<MailboxNodeData> = $props();
	
	let letters = $state<AttarMailbox[]>([]);
	let loading = $state(true);
	let selectedLetter = $state<AttarMailbox | null>(null);
	let showPopup = $state(false);
	let hoveredLetter = $state<string | null>(null);
	
	onMount(async () => {
		await loadLetters();
	});
	
	async function loadLetters() {
		loading = true;
		letters = await getPublishedLetters(20);
		loading = false;
	}
	
	function openLetter(letter: AttarMailbox) {
		selectedLetter = letter;
		showPopup = true;
	}
	
	function closePopup() {
		showPopup = false;
		selectedLetter = null;
	}
	
	async function handleVote(amount: number) {
		if (!selectedLetter) return { success: false, error: 'No letter selected' };
		
		const result = await voteOnLetter(selectedLetter.id, amount);
		
		if (result.success) {
			// Update local letter data
			letters = letters.map(l => 
				l.id === selectedLetter!.id 
					? { ...l, received_moons: l.received_moons + amount }
					: l
			);
			// Close after short delay
			setTimeout(closePopup, 1200);
		}
		
		return result;
	}
	
	function goToWriteLetter() {
		window.location.href = '/write';
	}
	
	function openMailboxPage() {
		window.location.href = '/mailbox';
	}
	
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);
		
		if (diffHours < 1) return 'just now';
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="mailbox-node flex flex-col w-full h-full rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
	<Handle type="target" position={Position.Left} id="center" class="!opacity-0 !w-1 !h-1" style="top: 50%; left: 50%;" />
	
	<!-- Terminal header -->
	<div class="flex items-center justify-between px-3 py-2 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
		<div class="flex items-center gap-2">
			<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8);">
				Mailbox.att
			</span>
		</div>
		<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.5);">
			{letters.length} letters
		</span>
	</div>
	
	<!-- Letters list -->
	<div class="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0" style="scrollbar-width: thin; scrollbar-color: rgba(200, 230, 180, 0.3) transparent;">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">Loading...</span>
			</div>
		{:else if letters.length === 0}
			<div class="flex items-center justify-center h-full flex-col gap-2">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">No letters yet</span>
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.3);">Be the first to write!</span>
			</div>
		{:else}
			{#each letters as letter (letter.id)}
				<button
					class="w-full text-left p-2 rounded transition-all duration-200"
					style="
						background: {hoveredLetter === letter.id ? 'rgba(200, 230, 180, 0.15)' : 'rgba(0,0,0,0.2)'};
						border: 1px solid {hoveredLetter === letter.id ? 'rgba(200, 230, 180, 0.4)' : 'rgba(120, 110, 130, 0.2)'};
						transform: {hoveredLetter === letter.id ? 'translateX(4px)' : 'translateX(0)'};
					"
					onmouseenter={() => hoveredLetter = letter.id}
					onmouseleave={() => hoveredLetter = null}
					onclick={() => openLetter(letter)}
				>
					<div class="flex items-start gap-2">
						<!-- User avatar or moon count badge -->
						<div class="shrink-0 flex items-center justify-center w-8 h-8 rounded overflow-hidden" style="background: rgba(200, 230, 180, 0.1);">
							{#if $profile?.avatar_url}
								<img src={$profile.avatar_url} alt="Avatar" class="w-full h-full object-cover" />
							{:else}
								<span class="text-xs" style="color: rgba(200, 230, 180, 0.7);">
									{letter.received_moons > 999 ? '999+' : letter.received_moons}
								</span>
							{/if}
						</div>
						
						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="text-xs truncate" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8);">
								{letter.subject}
							</div>
							<div class="flex items-center justify-between gap-1 mt-1">
								<span class="text-xs truncate" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.4); font-size: 9px;">
									{formatDate(letter.created_at)}
								</span>
								<span class="text-xs shrink-0" style="color: rgba(200, 230, 180, 0.4);">
									🌙 {letter.received_moons}
								</span>
							</div>
						</div>
					</div>
				</button>
			{/each}
		{/if}
	</div>
	
	<!-- Footer with buttons -->
	<div class="px-3 py-2 shrink-0 flex items-center justify-between" style="background: rgba(0,0,0,0.15); border-top: 1px solid rgba(120, 110, 130, 0.2);">
		<div class="flex items-center gap-1">
			{#if $profile}
				<span class="text-xs" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.5);">
					🌙 {$profile.available_moons}
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={openMailboxPage}
				class="text-xs px-2 py-1 rounded transition-all hover:scale-105"
				style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.6); border: 1px solid rgba(200, 230, 180, 0.2);"
			>
				Open
			</button>
			<button
				onclick={goToWriteLetter}
				class="text-xs px-2 py-1 rounded transition-all hover:scale-105"
				style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.8); border: 1px solid rgba(200, 230, 180, 0.3); background: rgba(200, 230, 180, 0.1);"
			>
				✉ Write
			</button>
		</div>
	</div>
</div>

<!-- Letter popup -->
{#if showPopup && selectedLetter}
	<div 
		class="fixed inset-0 bg-black/85 flex items-center justify-center z-[9999]"
		onclick={closePopup}
		onkeydown={(e) => e.key === 'Escape' && closePopup()}
		role="dialog"
		tabindex="-1"
	>
		<div 
			class="rounded-lg w-[90vw] max-w-lg max-h-[75vh] flex flex-col overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
			style="background: linear-gradient(145deg, rgba(35, 30, 45, 0.98) 0%, rgba(20, 18, 28, 1) 100%); border: 1px solid rgba(120, 110, 130, 0.5); font-family: 'JetBrains Mono', monospace; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);"
		>
			<!-- Popup header -->
			<div class="flex items-center justify-between px-4 py-3 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
				<div class="flex items-center gap-3 min-w-0">
					<!-- Moon count -->
					<div class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" style="background: rgba(200, 230, 180, 0.1); border: 1px solid rgba(200, 230, 180, 0.3);">
						<span class="text-sm" style="color: rgba(200, 230, 180, 0.9);">
							{selectedLetter.received_moons > 999 ? '999+' : selectedLetter.received_moons}
						</span>
					</div>
					<div class="min-w-0">
						<div class="text-sm truncate" style="color: rgba(200, 230, 180, 0.9);">
							{selectedLetter.subject}
						</div>
						<div class="text-xs mt-0.5" style="color: rgba(200, 230, 180, 0.5);">
							{formatDate(selectedLetter.created_at)} · 🌙 {selectedLetter.received_moons}
						</div>
					</div>
				</div>
				<button 
					onclick={closePopup}
					class="w-7 h-7 flex items-center justify-center rounded ml-2 shrink-0 transition-colors hover:bg-white/10" 
					style="border: 1px solid rgba(200, 230, 180, 0.3); color: rgba(200, 230, 180, 0.6);"
				>
					<span style="font-size: 16px;">×</span>
				</button>
			</div>
			
			<!-- Popup content - scrollable -->
			<div class="flex-1 overflow-y-auto p-4 min-h-0" style="scrollbar-width: thin; scrollbar-color: rgba(200, 230, 180, 0.3) transparent;">
				<p class="text-sm leading-relaxed whitespace-pre-wrap" style="color: rgba(200, 230, 180, 0.75);">
					{selectedLetter.content}
				</p>
			</div>
			
			<!-- Moon voter -->
			<MoonVoter onVote={handleVote} />
			
			<!-- Close button -->
			<div class="px-4 py-3 shrink-0" style="background: rgba(0,0,0,0.1); border-top: 1px solid rgba(120, 110, 130, 0.15);">
				<button
					onclick={closePopup}
					class="w-full text-xs py-2 rounded transition-all"
					style="color: rgba(200, 230, 180, 0.7); border: 1px solid rgba(200, 230, 180, 0.3);"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.mailbox-node {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
	
	.mailbox-node ::-webkit-scrollbar {
		width: 4px;
	}
	
	.mailbox-node ::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.mailbox-node ::-webkit-scrollbar-thumb {
		background: rgba(200, 230, 180, 0.3);
		border-radius: 2px;
	}
</style>
