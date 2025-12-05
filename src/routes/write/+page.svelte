<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sendLetter, getLetterCountToday } from '$lib/stores/mailbox';
	import { isAuthenticated, profile } from '$lib/stores/auth';
	
	let subject = $state('');
	let content = $state('');
	let sending = $state(false);
	let error = $state('');
	let success = $state('');
	let letterCountToday = $state(0);
	let loading = $state(true);
	
	const MAX_SUBJECT = 333;
	const MAX_CONTENT = 3333;
	const MAX_LETTERS_PER_DAY = 3;
	
	$effect(() => {
		if ($isAuthenticated) {
			loadLetterCount();
		} else {
			loading = false;
		}
	});
	
	async function loadLetterCount() {
		loading = true;
		letterCountToday = await getLetterCountToday();
		loading = false;
	}
	
	const remainingLetters = $derived(MAX_LETTERS_PER_DAY - letterCountToday);
	const canSend = $derived(remainingLetters > 0 && subject.trim().length > 0 && content.trim().length > 0);
	
	async function handleSend() {
		if (!$isAuthenticated) {
			error = 'Please log in to send letters';
			return;
		}
		
		if (!canSend) return;
		
		sending = true;
		error = '';
		success = '';
		
		try {
			const result = await sendLetter(subject.trim(), content.trim());
			
			if (result.success) {
				success = `Letter sent! You earned ${result.moons_awarded} 🌙`;
				subject = '';
				content = '';
				letterCountToday += 1;
				
				// Navigate back after short delay
				setTimeout(() => {
					goto('/');
				}, 1500);
			} else {
				error = result.error || 'Failed to send letter';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send letter';
		} finally {
			sending = false;
		}
	}
	
	function goBack() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Write Letter - Attar</title>
</svelte:head>

<div class="min-h-screen w-full flex items-center justify-center p-8" style="background: linear-gradient(145deg, #1a1520 0%, #0d0a10 100%); font-family: 'JetBrains Mono', monospace;">
	<div class="w-full max-w-2xl rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
		
		<!-- Header -->
		<div class="flex items-center justify-between px-6 py-4" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
			<div class="flex items-center gap-3">
				<span class="text-sm" style="color: rgba(200, 230, 180, 0.9);">
					Compose.att
				</span>
				{#if $isAuthenticated && !loading}
					<span class="text-xs px-2 py-0.5 rounded" style="background: rgba(200, 230, 180, 0.1); color: rgba(200, 230, 180, 0.6);">
						{remainingLetters}/{MAX_LETTERS_PER_DAY} remaining today
					</span>
				{/if}
			</div>
			<button
				onclick={goBack}
				class="text-xs px-3 py-1 rounded transition-all hover:bg-white/5"
				style="color: rgba(200, 230, 180, 0.6); border: 1px solid rgba(200, 230, 180, 0.3);"
			>
				← Back
			</button>
		</div>
		
		<!-- Not logged in message -->
		{#if !$isAuthenticated}
			<div class="p-6 text-center">
				<p class="text-sm mb-4" style="color: rgba(200, 230, 180, 0.7);">
					You need to be logged in to write letters.
				</p>
				<button
					onclick={goBack}
					class="text-xs px-4 py-2 rounded transition-all"
					style="background: rgba(200, 230, 180, 0.2); color: rgba(200, 230, 180, 0.9); border: 1px solid rgba(200, 230, 180, 0.4);"
				>
					Go Back
				</button>
			</div>
		{:else if loading}
			<div class="p-6 text-center">
				<p class="text-sm" style="color: rgba(200, 230, 180, 0.5);">Loading...</p>
			</div>
		{:else if remainingLetters <= 0}
			<div class="p-6 text-center">
				<p class="text-sm mb-2" style="color: rgba(200, 230, 180, 0.7);">
					You've reached your daily limit of {MAX_LETTERS_PER_DAY} letters.
				</p>
				<p class="text-xs mb-4" style="color: rgba(200, 230, 180, 0.4);">
					Come back tomorrow to write more.
				</p>
				<button
					onclick={goBack}
					class="text-xs px-4 py-2 rounded transition-all"
					style="background: rgba(200, 230, 180, 0.2); color: rgba(200, 230, 180, 0.9); border: 1px solid rgba(200, 230, 180, 0.4);"
				>
					Go Back
				</button>
			</div>
		{:else}
			<!-- Form -->
			<div class="p-6 space-y-4">
				<!-- To field - always Attar -->
				<div class="flex items-center gap-3 p-3 rounded" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(120, 110, 130, 0.2);">
					<span class="text-xs" style="color: rgba(200, 230, 180, 0.5);">To:</span>
					<span class="text-sm" style="color: rgba(200, 230, 180, 0.9);">Attar ✦</span>
				</div>
				
				<!-- Subject -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-xs" style="color: rgba(200, 230, 180, 0.6);">Subject:</label>
						<span class="text-xs" style="color: {subject.length > MAX_SUBJECT ? 'rgba(255, 120, 120, 0.8)' : 'rgba(200, 230, 180, 0.4)'};">
							{subject.length}/{MAX_SUBJECT}
						</span>
					</div>
					<input
						type="text"
						bind:value={subject}
						placeholder="Your message subject"
						maxlength={MAX_SUBJECT}
						disabled={sending}
						class="w-full px-4 py-3 rounded text-sm outline-none transition-all"
						style="background: rgba(0,0,0,0.3); border: 1px solid rgba(120, 110, 130, 0.3); color: rgba(200, 230, 180, 0.9);"
					/>
				</div>
				
				<!-- Content -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-xs" style="color: rgba(200, 230, 180, 0.6);">Message:</label>
						<span class="text-xs" style="color: {content.length > MAX_CONTENT ? 'rgba(255, 120, 120, 0.8)' : 'rgba(200, 230, 180, 0.4)'};">
							{content.length}/{MAX_CONTENT}
						</span>
					</div>
					<textarea
						bind:value={content}
						placeholder="Write your letter here..."
						maxlength={MAX_CONTENT}
						rows="10"
						disabled={sending}
						class="w-full px-4 py-3 rounded text-sm outline-none transition-all resize-none"
						style="background: rgba(0,0,0,0.3); border: 1px solid rgba(120, 110, 130, 0.3); color: rgba(200, 230, 180, 0.9);"
					></textarea>
				</div>
				
				<!-- Info -->
				<div class="text-xs" style="color: rgba(200, 230, 180, 0.4);">
					<p>✦ Sending a letter awards you <span style="color: rgba(200, 230, 180, 0.7);">+3 🌙</span></p>
					<p>✦ Your letter may be published if it contributes to Attar's story</p>
				</div>
				
				<!-- Error / Success messages -->
				{#if error}
					<div class="text-xs p-3 rounded" style="background: rgba(255, 100, 100, 0.1); border: 1px solid rgba(255, 100, 100, 0.3); color: rgba(255, 150, 150, 0.9);">
						{error}
					</div>
				{/if}
				
				{#if success}
					<div class="text-xs p-3 rounded" style="background: rgba(100, 255, 100, 0.1); border: 1px solid rgba(100, 255, 100, 0.3); color: rgba(150, 255, 150, 0.9);">
						{success}
					</div>
				{/if}
			</div>
			
			<!-- Footer -->
			<div class="px-6 py-4 flex items-center justify-between" style="background: rgba(0,0,0,0.15); border-top: 1px solid rgba(120, 110, 130, 0.2);">
				<span class="text-xs" style="color: rgba(200, 230, 180, 0.4);">
					{#if $profile}
						🌙 {$profile.available_moons}
					{/if}
				</span>
				<div class="flex gap-3">
					<button
						onclick={goBack}
						disabled={sending}
						class="text-xs px-4 py-2 rounded transition-all"
						style="color: rgba(200, 230, 180, 0.7); border: 1px solid rgba(200, 230, 180, 0.3);"
					>
						Cancel
					</button>
					<button
						onclick={handleSend}
						disabled={!canSend || sending}
						class="text-xs px-4 py-2 rounded transition-all"
						style="
							background: {canSend && !sending ? 'rgba(200, 230, 180, 0.2)' : 'rgba(100, 100, 100, 0.1)'};
							color: {canSend && !sending ? 'rgba(200, 230, 180, 0.9)' : 'rgba(200, 230, 180, 0.4)'};
							border: 1px solid {canSend && !sending ? 'rgba(200, 230, 180, 0.4)' : 'rgba(100, 100, 100, 0.2)'};
							cursor: {canSend && !sending ? 'pointer' : 'not-allowed'};
						"
					>
						{#if sending}
							Sending...
						{:else}
							Send Letter ✉
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	input::placeholder,
	textarea::placeholder {
		color: rgba(200, 230, 180, 0.3);
	}
	
	input:focus,
	textarea:focus {
		border-color: rgba(200, 230, 180, 0.5) !important;
	}
	
	input:disabled,
	textarea:disabled {
		opacity: 0.6;
	}
</style>
