<script lang="ts">
	import { isAuthenticated, profile } from '$lib/stores/auth';
	
	type Props = {
		onVote: (amount: number) => Promise<{ success: boolean; error?: string }>;
		disabled?: boolean;
		compact?: boolean;
	};
	
	let { onVote, disabled = false, compact = false }: Props = $props();
	
	let selectedMoons = $state(0);
	let customAmount = $state('');
	let voting = $state(false);
	let error = $state('');
	let success = $state('');
	
	const moonOptions = [1, 3, 5];
	
	function selectMoons(amount: number) {
		if (amount === selectedMoons) {
			selectedMoons = 0;
		} else {
			selectedMoons = amount;
			customAmount = '';
		}
	}
	
	function handleCustomInput() {
		const parsed = parseInt(customAmount);
		if (!isNaN(parsed) && parsed > 0) {
			selectedMoons = parsed;
		} else {
			selectedMoons = 0;
		}
	}
	
	async function handleVote() {
		if (selectedMoons <= 0 || voting || disabled) return;
		if (!$isAuthenticated) {
			error = 'Please log in to vote';
			return;
		}
		if (!$profile || $profile.available_moons < selectedMoons) {
			error = 'Not enough moons';
			return;
		}
		
		voting = true;
		error = '';
		success = '';
		
		const result = await onVote(selectedMoons);
		
		if (result.success) {
			success = `Sent ${selectedMoons} 🌙`;
			selectedMoons = 0;
			customAmount = '';
			// Clear success after delay
			setTimeout(() => { success = ''; }, 2000);
		} else {
			error = result.error || 'Failed to vote';
		}
		
		voting = false;
	}
	
	function reset() {
		selectedMoons = 0;
		customAmount = '';
		error = '';
		success = '';
	}
</script>

<div class="moon-voter" class:compact style="font-family: 'JetBrains Mono', monospace;">
	{#if $isAuthenticated}
		<div class="flex items-center justify-between mb-2">
			<span class="text-xs" style="color: rgba(200, 230, 180, 0.6);">
				{compact ? '🌙' : 'Show appreciation with 🌙'}
			</span>
			<span class="text-xs" style="color: rgba(200, 230, 180, 0.4);">
				{$profile?.available_moons ?? 0} available
			</span>
		</div>
		
		<div class="flex items-center gap-2 mb-2">
			{#each moonOptions as amount}
				<button
					onclick={() => selectMoons(amount)}
					disabled={voting || disabled || ($profile && $profile.available_moons < amount)}
					class="flex-1 py-2 rounded text-xs transition-all"
					style="
						background: {selectedMoons === amount ? 'rgba(200, 230, 180, 0.25)' : 'rgba(0,0,0,0.2)'};
						border: 1px solid {selectedMoons === amount ? 'rgba(200, 230, 180, 0.5)' : 'rgba(120, 110, 130, 0.3)'};
						color: {$profile && $profile.available_moons < amount ? 'rgba(200, 230, 180, 0.3)' : 'rgba(200, 230, 180, 0.8)'};
						cursor: {$profile && $profile.available_moons < amount ? 'not-allowed' : 'pointer'};
					"
				>
					{amount} 🌙
				</button>
			{/each}
			<input
				type="number"
				bind:value={customAmount}
				oninput={handleCustomInput}
				placeholder="?"
				min="1"
				max={$profile?.available_moons ?? 0}
				disabled={voting || disabled}
				class="w-12 py-2 px-2 rounded text-xs text-center outline-none"
				style="
					background: {customAmount ? 'rgba(200, 230, 180, 0.15)' : 'rgba(0,0,0,0.2)'};
					border: 1px solid {customAmount ? 'rgba(200, 230, 180, 0.5)' : 'rgba(120, 110, 130, 0.3)'};
					color: rgba(200, 230, 180, 0.8);
				"
			/>
		</div>
		
		{#if error}
			<div class="text-xs mb-2" style="color: rgba(255, 150, 150, 0.9);">{error}</div>
		{/if}
		{#if success}
			<div class="text-xs mb-2" style="color: rgba(150, 255, 150, 0.9);">{success}</div>
		{/if}
		
		{#if selectedMoons > 0}
			<button
				onclick={handleVote}
				disabled={voting || disabled || !$profile || $profile.available_moons < selectedMoons}
				class="w-full text-xs py-2 rounded transition-all"
				style="
					background: rgba(200, 230, 180, 0.2);
					color: rgba(200, 230, 180, 0.9);
					border: 1px solid rgba(200, 230, 180, 0.4);
					opacity: {voting ? 0.6 : 1};
				"
			>
				{#if voting}
					Sending...
				{:else}
					Send {selectedMoons} 🌙
				{/if}
			</button>
		{/if}
	{:else}
		<div class="text-xs text-center py-2" style="color: rgba(200, 230, 180, 0.5);">
			Log in to vote with moons
		</div>
	{/if}
</div>

<style>
	.moon-voter {
		padding: 12px;
		background: rgba(0, 0, 0, 0.15);
		border-top: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.moon-voter.compact {
		padding: 8px;
	}
	
	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	input[type="number"] {
		-moz-appearance: textfield;
	}
</style>

