<script lang="ts">
	import type { AttarMailbox } from '$lib/supabase';
	import MoonVoter from './MoonVoter.svelte';
	import { voteOnLetter } from '$lib/stores/mailbox';
	
	type Props = {
		letters: AttarMailbox[];
		selectedId?: string | null;
		onSelect?: (letter: AttarMailbox) => void;
		onClose?: () => void;
	};
	
	let { letters, selectedId = null, onSelect, onClose }: Props = $props();
	
	let internalSelectedId = $state<string | null>(null);
	let localLetters = $state<AttarMailbox[]>([]);
	
	// Sync props to local state
	$effect(() => {
		localLetters = [...letters];
	});
	
	$effect(() => {
		if (selectedId !== undefined) {
			internalSelectedId = selectedId;
		}
	});
	
	const selectedLetter = $derived(
		localLetters.find(l => l.id === internalSelectedId) || null
	);
	
	function selectLetter(letter: AttarMailbox) {
		internalSelectedId = letter.id;
		onSelect?.(letter);
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
	
	async function handleVote(amount: number) {
		if (!selectedLetter) return { success: false, error: 'No letter selected' };
		
		const result = await voteOnLetter(selectedLetter.id, amount);
		
		if (result.success) {
			// Update local letter data
			localLetters = localLetters.map(l => 
				l.id === selectedLetter.id 
					? { ...l, received_moons: l.received_moons + amount }
					: l
			);
		}
		
		return result;
	}
</script>

<div class="letter-reader flex h-full w-full" style="font-family: 'JetBrains Mono', monospace;">
	<!-- Sidebar - Letter list -->
	<div class="letter-sidebar flex flex-col shrink-0" style="width: 320px; background: rgba(0,0,0,0.3); border-right: 1px solid rgba(120, 110, 130, 0.3);">
		<!-- Sidebar header -->
		<div class="px-4 py-3 shrink-0" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.2);">
			<div class="text-sm" style="color: rgba(200, 230, 180, 0.9);">
				Inbox
			</div>
			<div class="text-xs mt-1" style="color: rgba(200, 230, 180, 0.5);">
				{letters.length} letters
			</div>
		</div>
		
		<!-- Letter list -->
		<div class="flex-1 overflow-y-auto" style="scrollbar-width: thin; scrollbar-color: rgba(200, 230, 180, 0.3) transparent;">
			{#each localLetters as letter (letter.id)}
				<button
					onclick={() => selectLetter(letter)}
					class="w-full text-left p-3 transition-all border-b"
					style="
						background: {internalSelectedId === letter.id ? 'rgba(200, 230, 180, 0.1)' : 'transparent'};
						border-left: 3px solid {internalSelectedId === letter.id ? 'rgba(200, 230, 180, 0.6)' : 'transparent'};
						border-bottom-color: rgba(120, 110, 130, 0.15);
					"
				>
					<div class="flex items-start gap-3">
						<!-- Moon badge -->
						<div class="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg" style="background: rgba(200, 230, 180, 0.08);">
							<span class="text-xs" style="color: rgba(200, 230, 180, 0.7);">
								{letter.received_moons > 99 ? '99+' : letter.received_moons}
							</span>
						</div>
						
						<!-- Content preview -->
						<div class="flex-1 min-w-0">
							<div class="text-sm truncate" style="color: {internalSelectedId === letter.id ? 'rgba(200, 230, 180, 0.95)' : 'rgba(200, 230, 180, 0.8)'};">
								{letter.subject}
							</div>
							<div class="text-xs mt-1 truncate" style="color: rgba(200, 230, 180, 0.4);">
								{letter.content.slice(0, 60)}...
							</div>
							<div class="flex items-center justify-between mt-2">
								<span class="text-xs" style="color: rgba(200, 230, 180, 0.35); font-size: 10px;">
									{formatDate(letter.created_at)}
								</span>
								<span class="text-xs" style="color: rgba(200, 230, 180, 0.4);">
									🌙 {letter.received_moons}
								</span>
							</div>
						</div>
					</div>
				</button>
			{/each}
			
			{#if letters.length === 0}
				<div class="flex items-center justify-center h-full p-8">
					<div class="text-center">
						<div class="text-2xl mb-2" style="opacity: 0.3;">📭</div>
						<div class="text-xs" style="color: rgba(200, 230, 180, 0.4);">No letters yet</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Main content - Selected letter -->
	<div class="flex-1 flex flex-col min-w-0">
		{#if selectedLetter}
			<!-- Letter header -->
			<div class="px-6 py-4 shrink-0 flex items-center justify-between" style="background: rgba(0,0,0,0.15); border-bottom: 1px solid rgba(120, 110, 130, 0.2);">
				<div class="flex items-center gap-4 min-w-0">
					<!-- Moon count badge -->
					<div class="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg" style="background: rgba(200, 230, 180, 0.1); border: 1px solid rgba(200, 230, 180, 0.3);">
						<span class="text-base" style="color: rgba(200, 230, 180, 0.9);">
							{selectedLetter.received_moons}
						</span>
					</div>
					<div class="min-w-0">
						<h2 class="text-base truncate" style="color: rgba(200, 230, 180, 0.95);">
							{selectedLetter.subject}
						</h2>
						<div class="text-xs mt-1" style="color: rgba(200, 230, 180, 0.5);">
							{formatDate(selectedLetter.created_at)} · 🌙 {selectedLetter.received_moons} moons received
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
			
			<!-- Letter content -->
			<div class="flex-1 overflow-y-auto p-6" style="scrollbar-width: thin; scrollbar-color: rgba(200, 230, 180, 0.3) transparent;">
				<p class="text-sm leading-relaxed whitespace-pre-wrap" style="color: rgba(200, 230, 180, 0.75);">
					{selectedLetter.content}
				</p>
			</div>
			
			<!-- Moon voter -->
			<MoonVoter onVote={handleVote} />
		{:else}
			<!-- No selection state -->
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center">
					<div class="text-4xl mb-4" style="opacity: 0.2;">📬</div>
					<div class="text-sm" style="color: rgba(200, 230, 180, 0.4);">
						Select a letter to read
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.letter-sidebar ::-webkit-scrollbar {
		width: 4px;
	}
	
	.letter-sidebar ::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.letter-sidebar ::-webkit-scrollbar-thumb {
		background: rgba(200, 230, 180, 0.3);
		border-radius: 2px;
	}
</style>

