<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAuthenticated, profile, refreshProfile } from '$lib/stores/auth';
	import { voteOnDecision } from '$lib/stores/moons';
	import type { CurrentEnv } from '$lib/stores/env';
	import type { BackstoryEntry } from '$lib/stores/backstory';
	
	type Props = {
		currentEnv: CurrentEnv;
		latestBackstory: BackstoryEntry | null;
	};
	
	let { currentEnv, latestBackstory }: Props = $props();
	
	// Local state for choices (to update votes)
	let choices = $state(currentEnv.choices);
	
	// Expanded choice for voting
	let expandedChoiceId = $state<string | null>(null);
	let selectedMoons = $state(0);
	let voting = $state(false);
	let voteError = $state('');
	let voteSuccess = $state('');
	
	// Show full backstory text
	let showFullBackstory = $state(false);
	
	const moonOptions = [1, 3, 5];
	
	// Sync choices when currentEnv changes
	$effect(() => {
		choices = currentEnv.choices;
	});
	
	const tabs = [
		{ id: 'mailbox' as const, icon: '✉', label: 'Mail' },
		{ id: 'world' as const, icon: '◆', label: 'Today' },
		{ id: 'memory' as const, icon: '⬡', label: 'Memory' },
		{ id: 'timeline' as const, icon: '↓', label: 'Time' }
	];
	
	function handleTabClick(tabId: string) {
		if (tabId === 'world') return;
		switch (tabId) {
			case 'mailbox': goto('/mailbox'); break;
			case 'memory': goto('/memories'); break;
			case 'timeline': goto('/timeline'); break;
		}
	}
	
	function calculateTotalVotes() {
		return choices.reduce((sum, c) => sum + c.votes, 0);
	}
	
	function getVotePercentage(votes: number) {
		const total = calculateTotalVotes();
		if (total === 0) return 0;
		return Math.round((votes / total) * 100);
	}
	
	function toggleChoice(choiceId: string) {
		if (expandedChoiceId === choiceId) {
			expandedChoiceId = null;
			selectedMoons = 0;
			voteError = '';
			voteSuccess = '';
		} else {
			expandedChoiceId = choiceId;
			selectedMoons = 0;
			voteError = '';
			voteSuccess = '';
		}
	}
	
	function selectMoons(amount: number) {
		selectedMoons = selectedMoons === amount ? 0 : amount;
	}
	
	async function handleVote(choiceId: string) {
		if (!$isAuthenticated || !$profile || selectedMoons <= 0 || voting) return;
		
		if ($profile.available_moons < selectedMoons) {
			voteError = 'Not enough moons';
			return;
		}
		
		const choiceIndex = choices.findIndex(c => c.id === choiceId);
		if (choiceIndex === -1) return;
		
		voting = true;
		voteError = '';
		
		const success = await voteOnDecision(currentEnv.id, choiceIndex, selectedMoons);
		
		if (success) {
			// Update local vote count
			choices = choices.map((c, i) => 
				i === choiceIndex ? { ...c, votes: c.votes + selectedMoons } : c
			);
			
			voteSuccess = `+${selectedMoons} 🌙`;
			await refreshProfile();
			
			setTimeout(() => {
				expandedChoiceId = null;
				selectedMoons = 0;
				voteSuccess = '';
				voting = false;
			}, 1000);
		} else {
			voteError = 'Vote failed';
			voting = false;
		}
	}
	
	// Check if media is video
	const isVideo = $derived(
		currentEnv.worldVideoUrl || 
		(currentEnv.worldImageUrl && (
			currentEnv.worldImageUrl.endsWith('.mp4') || 
			currentEnv.worldImageUrl.endsWith('.webm')
		))
	);
	
	const mediaUrl = $derived(currentEnv.worldVideoUrl || currentEnv.worldImageUrl || '/worlds/be.png');
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="mobile-container">
	<!-- Background pattern -->
	<div class="bg-pattern"></div>
	
	<!-- Scrollable content -->
	<div class="content-scroll">
		<!-- Hero Section - Large video -->
		<div class="hero-section">
			<!-- Media - Full width, taller -->
			<div class="hero-media">
				{#if isVideo}
					<video src={mediaUrl} autoplay loop muted playsinline class="media-element"></video>
				{:else}
					<img src={mediaUrl} alt={currentEnv.title} class="media-element" />
				{/if}
				<div class="media-overlay"></div>
				
				<!-- Day badge -->
				<div class="day-badge">Day {currentEnv.day}</div>
				
				<!-- Title overlay on video -->
				<div class="title-overlay">
					<h1 class="world-title">{currentEnv.title}</h1>
				</div>
			</div>
			
			<!-- Backstory - compact with read more -->
			{#if latestBackstory?.text}
				<div class="backstory-section">
					{#if showFullBackstory}
						<p class="backstory-text">{latestBackstory.text}</p>
						<button class="read-more-btn" onclick={() => showFullBackstory = false}>Show less</button>
					{:else}
						<p class="backstory-text truncated">{latestBackstory.text.slice(0, 80)}{latestBackstory.text.length > 80 ? '...' : ''}</p>
						{#if latestBackstory.text.length > 80}
							<button class="read-more-btn" onclick={() => showFullBackstory = true}>Read more</button>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
		
		<!-- Choices Section -->
		<div class="choices-section">
			<div class="section-header">
				<span class="section-title">Shape Today's Path</span>
				<span class="vote-count">{calculateTotalVotes()} votes</span>
			</div>
			
			<div class="choices-list">
				{#each choices as choice (choice.id)}
					{@const isExpanded = expandedChoiceId === choice.id}
					{@const percentage = getVotePercentage(choice.votes)}
					
					<div class="choice-card" class:expanded={isExpanded}>
						<!-- Choice Header (always visible, tappable) -->
						<button class="choice-header" onclick={() => toggleChoice(choice.id)}>
							<div class="choice-main">
								<span class="choice-title">{choice.title}</span>
								<span class="choice-votes">{percentage}%</span>
							</div>
							<div class="progress-bar">
								<div class="progress-fill" style="width: {percentage}%"></div>
							</div>
							{#if !isExpanded}
								<p class="choice-preview">{choice.description.slice(0, 60)}...</p>
							{/if}
						</button>
						
						<!-- Expanded Content (voting) -->
						{#if isExpanded}
							<div class="choice-expanded">
								<p class="choice-description">{choice.description}</p>
								
								{#if $isAuthenticated}
									<div class="vote-section">
										<div class="vote-header">
											<span>Vote with moons</span>
											<span class="balance">🌙 {$profile?.available_moons ?? 0}</span>
										</div>
										
										<div class="moon-buttons">
											{#each moonOptions as amount}
												<button
													class="moon-btn"
													class:selected={selectedMoons === amount}
													class:disabled={$profile && $profile.available_moons < amount}
													disabled={voting || ($profile && $profile.available_moons < amount)}
													onclick={() => selectMoons(amount)}
												>
													{amount} 🌙
												</button>
											{/each}
										</div>
										
										{#if voteError}
											<div class="vote-error">{voteError}</div>
										{/if}
										
										{#if voteSuccess}
											<div class="vote-success">{voteSuccess}</div>
										{:else if selectedMoons > 0}
											<button 
												class="vote-submit"
												disabled={voting}
												onclick={() => handleVote(choice.id)}
											>
												{#if voting}
													Voting...
												{:else}
													Vote {selectedMoons} 🌙 for {choice.title}
												{/if}
											</button>
										{/if}
									</div>
								{:else}
									<div class="login-prompt">
										<span>Log in to vote</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
	
	<!-- Bottom navigation tabs -->
	<nav class="bottom-tabs">
		{#each tabs as tab (tab.id)}
			<button 
				class="tab-btn"
				class:active={tab.id === 'world'}
				onclick={() => handleTabClick(tab.id)}
			>
				<span class="tab-icon">{tab.icon}</span>
				<span class="tab-label">{tab.label}</span>
			</button>
		{/each}
	</nav>
</div>

<style>
	.mobile-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #0a0a0c;
		font-family: 'JetBrains Mono', monospace;
	}
	
	.bg-pattern {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
		background-size: 20px 20px;
		z-index: 0;
	}
	
	/* Scrollable content area */
	.content-scroll {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		padding-bottom: 90px; /* Space for bottom tabs */
		z-index: 1;
	}
	
	/* Hero Section */
	.hero-section {
		position: relative;
	}
	
	.hero-media {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 5; /* Taller video - takes more screen space */
		max-height: 55vh;
		overflow: hidden;
	}
	
	.media-element {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.media-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg, 
			transparent 0%,
			transparent 50%, 
			rgba(10, 10, 12, 0.6) 75%, 
			rgba(10, 10, 12, 0.95) 100%
		);
	}
	
	.day-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		padding: 5px 10px;
		font-size: 10px;
		color: rgba(200, 230, 180, 0.9);
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(200, 230, 180, 0.25);
		border-radius: 5px;
		backdrop-filter: blur(8px);
	}
	
	.title-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 16px;
		z-index: 2;
	}
	
	.world-title {
		font-size: 20px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.95);
		margin: 0;
		line-height: 1.3;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}
	
	/* Backstory section - compact */
	.backstory-section {
		padding: 12px 16px;
		background: rgba(30, 25, 40, 0.5);
		border-bottom: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.backstory-text {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.6);
		margin: 0;
		line-height: 1.5;
	}
	
	.backstory-text.truncated {
		display: inline;
	}
	
	.read-more-btn {
		display: inline;
		padding: 0;
		margin-left: 4px;
		font-size: 12px;
		font-family: inherit;
		color: rgba(147, 112, 219, 0.9);
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
	}
	
	.read-more-btn:active {
		opacity: 0.7;
	}
	
	/* Choices Section */
	.choices-section {
		padding: 0 16px 20px;
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
		padding: 0 4px;
	}
	
	.section-title {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.8);
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	
	.vote-count {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.4);
	}
	
	.choices-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	/* Choice Card */
	.choice-card {
		background: rgba(40, 35, 50, 0.6);
		border: 1px solid rgba(120, 110, 130, 0.3);
		border-radius: 14px;
		overflow: hidden;
		transition: all 0.2s ease;
	}
	
	.choice-card.expanded {
		background: rgba(50, 45, 60, 0.8);
		border-color: rgba(200, 230, 180, 0.3);
	}
	
	.choice-header {
		width: 100%;
		padding: 16px;
		text-align: left;
		background: transparent;
		border: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	
	.choice-header:active {
		background: rgba(200, 230, 180, 0.05);
	}
	
	.choice-main {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	
	.choice-title {
		font-size: 15px;
		font-weight: 500;
		color: rgba(200, 230, 180, 0.95);
	}
	
	.choice-votes {
		font-size: 14px;
		color: rgba(147, 112, 219, 0.9);
		font-weight: 500;
	}
	
	.progress-bar {
		height: 4px;
		background: rgba(200, 230, 180, 0.1);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 10px;
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, rgba(147, 112, 219, 0.7), rgba(200, 230, 180, 0.7));
		border-radius: 2px;
		transition: width 0.3s ease;
	}
	
	.choice-preview {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.5);
		margin: 0;
		line-height: 1.4;
	}
	
	/* Expanded Choice Content */
	.choice-expanded {
		padding: 0 16px 16px;
		border-top: 1px solid rgba(120, 110, 130, 0.2);
		animation: slideDown 0.2s ease;
	}
	
	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.choice-description {
		font-size: 13px;
		color: rgba(200, 230, 180, 0.7);
		line-height: 1.6;
		margin: 16px 0;
	}
	
	/* Vote Section */
	.vote-section {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 10px;
		padding: 14px;
	}
	
	.vote-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.6);
	}
	
	.balance {
		color: rgba(200, 230, 180, 0.5);
	}
	
	.moon-buttons {
		display: flex;
		gap: 10px;
		margin-bottom: 12px;
	}
	
	.moon-btn {
		flex: 1;
		padding: 14px 8px;
		font-size: 14px;
		font-family: inherit;
		background: rgba(200, 230, 180, 0.08);
		border: 1px solid rgba(200, 230, 180, 0.2);
		border-radius: 10px;
		color: rgba(200, 230, 180, 0.8);
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.moon-btn.selected {
		background: rgba(200, 230, 180, 0.2);
		border-color: rgba(200, 230, 180, 0.5);
		color: rgba(200, 230, 180, 1);
	}
	
	.moon-btn.disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	.moon-btn:active:not(.disabled) {
		transform: scale(0.96);
	}
	
	.vote-submit {
		width: 100%;
		padding: 16px;
		font-size: 14px;
		font-family: inherit;
		background: rgba(147, 112, 219, 0.25);
		border: 1px solid rgba(147, 112, 219, 0.5);
		border-radius: 10px;
		color: rgba(220, 210, 255, 0.95);
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.vote-submit:active:not(:disabled) {
		transform: scale(0.98);
		background: rgba(147, 112, 219, 0.35);
	}
	
	.vote-submit:disabled {
		opacity: 0.6;
	}
	
	.vote-error {
		padding: 10px;
		margin-bottom: 10px;
		font-size: 12px;
		color: rgba(255, 150, 150, 0.9);
		background: rgba(255, 100, 100, 0.1);
		border-radius: 6px;
		text-align: center;
	}
	
	.vote-success {
		padding: 14px;
		font-size: 16px;
		color: rgba(150, 255, 150, 0.95);
		background: rgba(100, 255, 100, 0.1);
		border-radius: 8px;
		text-align: center;
	}
	
	.login-prompt {
		padding: 16px;
		text-align: center;
		font-size: 13px;
		color: rgba(200, 230, 180, 0.5);
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}
	
	/* Bottom navigation */
	.bottom-tabs {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		align-items: center;
		height: 72px;
		padding: 8px 12px;
		padding-bottom: max(8px, env(safe-area-inset-bottom));
		background: linear-gradient(180deg, rgba(20, 18, 25, 0.95) 0%, rgba(15, 13, 20, 0.98) 100%);
		border-top: 1px solid rgba(120, 110, 130, 0.3);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		z-index: 100;
	}
	
	.tab-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 4px;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
		min-height: 56px;
		min-width: 44px;
	}
	
	.tab-btn:active {
		transform: scale(0.95);
	}
	
	.tab-icon {
		font-size: 20px;
		color: rgba(200, 230, 180, 0.4);
		transition: all 0.2s ease;
	}
	
	.tab-label {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		transition: all 0.2s ease;
	}
	
	.tab-btn.active .tab-icon {
		color: rgba(200, 230, 180, 0.95);
		transform: scale(1.1);
		text-shadow: 0 0 12px rgba(200, 230, 180, 0.5);
	}
	
	.tab-btn.active .tab-label {
		color: rgba(200, 230, 180, 0.9);
	}
</style>
