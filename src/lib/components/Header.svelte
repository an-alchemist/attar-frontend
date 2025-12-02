<script lang="ts">
	import { isAuthenticated, profile, signOut } from '$lib/stores/auth';
	
	type Props = {
		onAuthClick?: () => void;
		onSettingsClick?: () => void;
	};
	
	let { onAuthClick, onSettingsClick }: Props = $props();
	
	let showAbout = $state(false);
	let showExplore = $state(false);
	let showProfile = $state(false);
	
	const exploreItems = [
		{ id: 'backstory', name: 'Backstory', icon: '◈', description: 'The entity\'s evolution' },
		{ id: 'mailbox', name: 'Mailbox', icon: '✉', description: 'Community letters' },
		{ id: 'memory', name: 'Memory', icon: '⬡', description: 'Daily fragments' },
		{ id: 'timeline', name: 'Timeline', icon: '↓', description: 'Journey through time' },
		{ id: 'world', name: 'Today', icon: '◆', description: 'Return to center card' }
	];
	
	function navigateToNode(nodeId: string) {
		window.dispatchEvent(new CustomEvent('navigate-to-node', { detail: { nodeId } }));
		showExplore = false;
	}
	
	function closeAbout() {
		showAbout = false;
	}
	
	function handleAuthClick() {
		if (onAuthClick) {
			onAuthClick();
		}
	}
	
	function handleSettingsClick() {
		showProfile = false;
		if (onSettingsClick) {
			onSettingsClick();
		}
	}
	
	async function handleSignOut() {
		await signOut();
		showProfile = false;
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<header class="header-container">
	<!-- Logo -->
	<a href="/" class="logo">
		<span class="logo-symbol">◆</span>
		<span class="logo-text">Attar</span>
	</a>
	
	<!-- Navigation -->
	<nav class="nav">
		<!-- About -->
		<button 
			class="nav-link"
			onclick={() => showAbout = true}
		>
			About
		</button>
		
		<!-- Explore dropdown -->
		<div class="nav-dropdown">
			<button 
				class="nav-link"
				onclick={() => showExplore = !showExplore}
				onblur={() => setTimeout(() => showExplore = false, 200)}
			>
				Explore
				<span class="dropdown-arrow" class:open={showExplore}>▾</span>
			</button>
			
			{#if showExplore}
				<div class="dropdown-menu">
					{#each exploreItems as item (item.id)}
						<button 
							class="dropdown-item"
							onclick={() => navigateToNode(item.id)}
						>
							<span class="item-icon">{item.icon}</span>
							<div class="item-content">
								<span class="item-name">{item.name}</span>
								<span class="item-desc">{item.description}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Auth section -->
		<div class="nav-divider"></div>
		
		{#if $isAuthenticated && $profile}
			<!-- Profile dropdown -->
			<div class="nav-dropdown">
				<button 
					class="profile-btn"
					onclick={() => showProfile = !showProfile}
					onblur={() => setTimeout(() => showProfile = false, 200)}
				>
					<span class="moon-badge">🌙 {$profile.available_moons}</span>
					<span class="profile-name">{$profile.pseudoname}</span>
					<span class="dropdown-arrow" class:open={showProfile}>▾</span>
				</button>
				
				{#if showProfile}
					<div class="dropdown-menu profile-menu">
						<div class="profile-header">
							<div class="profile-avatar">
								{#if $profile.avatar_url}
									<img src={$profile.avatar_url} alt="Avatar" />
								{:else}
									<span class="avatar-placeholder">◆</span>
								{/if}
							</div>
							<div class="profile-info">
								<span class="profile-name-large">{$profile.pseudoname}</span>
								<span class="profile-moons">🌙 {$profile.available_moons} moons today</span>
							</div>
						</div>
						<div class="profile-divider"></div>
						<button class="dropdown-item" onclick={handleSettingsClick}>
							<span class="item-icon">⚙</span>
							<div class="item-content">
								<span class="item-name">Settings</span>
								<span class="item-desc">Edit your profile</span>
							</div>
						</button>
						<button class="dropdown-item logout-item" onclick={handleSignOut}>
							<span class="item-icon">↪</span>
							<div class="item-content">
								<span class="item-name">Sign Out</span>
								<span class="item-desc">See you soon</span>
							</div>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<button class="auth-btn" onclick={handleAuthClick}>
				<span class="auth-icon">◇</span>
				<span>Enter</span>
			</button>
		{/if}
	</nav>
</header>

<!-- About popup -->
{#if showAbout}
	<div 
		class="about-overlay"
		onclick={closeAbout}
		onkeydown={(e) => e.key === 'Escape' && closeAbout()}
		role="dialog"
		tabindex="-1"
	>
		<div 
			class="about-modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="about-header">
				<span class="about-title">About Attar</span>
				<button class="about-close" onclick={closeAbout}>×</button>
			</div>
			<div class="about-content">
				<p>
					<strong>Attar</strong> is an autonomous digital entity that evolves through collective interaction.
				</p>
				<p>
					Every day, the community votes on the entity's next path. Each choice shapes its identity, 
					knowledge, capabilities, and the world it inhabits.
				</p>
				<p>
					Watch it grow. Guide its journey. Witness the emergence of something new.
				</p>
				<div class="about-stats">
					<div class="stat">
						<span class="stat-value">222</span>
						<span class="stat-label">Days alive</span>
					</div>
					<div class="stat">
						<span class="stat-value">∞</span>
						<span class="stat-label">Possibilities</span>
					</div>
					<div class="stat">
						<span class="stat-value">1</span>
						<span class="stat-label">Entity</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.header-container {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 10px 16px;
		z-index: 100;
		background: linear-gradient(145deg, rgba(40, 35, 50, 0.95) 0%, rgba(25, 22, 32, 0.98) 100%);
		border: 1px solid rgba(120, 110, 130, 0.4);
		border-radius: 14px;
		box-shadow: 
			0 10px 40px rgba(0, 0, 0, 0.5),
			0 0 20px rgba(0, 0, 0, 0.3);
		font-family: 'JetBrains Mono', monospace;
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		padding: 6px 12px;
		border-radius: 8px;
		transition: all 0.2s ease;
	}
	
	.logo:hover {
		background: rgba(200, 230, 180, 0.1);
	}
	
	.logo-symbol {
		font-size: 16px;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.logo-text {
		font-size: 15px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.95);
		letter-spacing: 1.5px;
	}
	
	.nav {
		display: flex;
		align-items: center;
		gap: 4px;
		padding-left: 12px;
		border-left: 1px solid rgba(200, 230, 180, 0.15);
	}
	
	.nav-link {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.7);
		background: rgba(200, 230, 180, 0.05);
		border: 1px solid rgba(200, 230, 180, 0.15);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.nav-link:hover {
		color: rgba(200, 230, 180, 0.95);
		background: rgba(200, 230, 180, 0.15);
		border-color: rgba(200, 230, 180, 0.3);
		transform: translateY(-1px);
	}
	
	.dropdown-arrow {
		font-size: 10px;
		transition: transform 0.2s ease;
	}
	
	.dropdown-arrow.open {
		transform: rotate(180deg);
	}
	
	.nav-dropdown {
		position: relative;
	}
	
	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		min-width: 220px;
		background: linear-gradient(145deg, rgba(40, 35, 50, 0.98) 0%, rgba(25, 22, 32, 1) 100%);
		border: 1px solid rgba(120, 110, 130, 0.4);
		border-radius: 10px;
		padding: 8px;
		box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
	}
	
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 12px;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}
	
	.dropdown-item:hover {
		background: rgba(200, 230, 180, 0.1);
	}
	
	.item-icon {
		font-size: 16px;
		color: rgba(200, 230, 180, 0.6);
		width: 24px;
		text-align: center;
	}
	
	.item-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.item-name {
		font-size: 13px;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.item-desc {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
	}
	
	/* About popup styles */
	.about-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		font-family: 'JetBrains Mono', monospace;
	}
	
	.about-modal {
		background: linear-gradient(145deg, rgba(40, 35, 50, 0.98) 0%, rgba(25, 22, 32, 1) 100%);
		border: 1px solid rgba(120, 110, 130, 0.4);
		border-radius: 16px;
		width: 90vw;
		max-width: 480px;
		overflow: hidden;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
	}
	
	.about-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.about-title {
		font-size: 16px;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.about-close {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		color: rgba(200, 230, 180, 0.5);
		background: transparent;
		border: 1px solid rgba(200, 230, 180, 0.2);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.about-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(200, 230, 180, 0.8);
	}
	
	.about-content {
		padding: 24px;
	}
	
	.about-content p {
		font-size: 14px;
		line-height: 1.7;
		color: rgba(200, 230, 180, 0.7);
		margin-bottom: 16px;
	}
	
	.about-content p:last-of-type {
		margin-bottom: 24px;
	}
	
	.about-content strong {
		color: rgba(200, 230, 180, 0.95);
	}
	
	.about-stats {
		display: flex;
		gap: 16px;
		padding-top: 16px;
		border-top: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}
	
	.stat-value {
		font-size: 24px;
		font-weight: 500;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.stat-label {
		font-size: 10px;
		color: rgba(200, 230, 180, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	/* Auth button and profile styles */
	.nav-divider {
		width: 1px;
		height: 20px;
		background: rgba(200, 230, 180, 0.15);
		margin: 0 8px;
	}
	
	.auth-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.95);
		background: linear-gradient(135deg, rgba(200, 230, 180, 0.15) 0%, rgba(200, 230, 180, 0.08) 100%);
		border: 1px solid rgba(200, 230, 180, 0.3);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: 'JetBrains Mono', monospace;
	}
	
	.auth-btn:hover {
		background: linear-gradient(135deg, rgba(200, 230, 180, 0.25) 0%, rgba(200, 230, 180, 0.12) 100%);
		border-color: rgba(200, 230, 180, 0.5);
		transform: translateY(-1px);
	}
	
	.auth-icon {
		font-size: 14px;
	}
	
	.profile-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 12px;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.9);
		background: rgba(200, 230, 180, 0.08);
		border: 1px solid rgba(200, 230, 180, 0.2);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: 'JetBrains Mono', monospace;
	}
	
	.profile-btn:hover {
		background: rgba(200, 230, 180, 0.15);
		border-color: rgba(200, 230, 180, 0.35);
	}
	
	.moon-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: rgba(200, 230, 180, 0.1);
		border-radius: 6px;
		font-size: 11px;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.profile-name {
		color: rgba(200, 230, 180, 0.7);
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.profile-menu {
		min-width: 260px;
		padding: 0;
		overflow: hidden;
	}
	
	.profile-header {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px;
		background: rgba(0, 0, 0, 0.2);
	}
	
	.profile-avatar {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid rgba(200, 230, 180, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(200, 230, 180, 0.1);
	}
	
	.profile-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.avatar-placeholder {
		font-size: 20px;
		color: rgba(200, 230, 180, 0.6);
	}
	
	.profile-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.profile-name-large {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.95);
		font-weight: 500;
	}
	
	.profile-moons {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.5);
	}
	
	.profile-divider {
		height: 1px;
		background: rgba(120, 110, 130, 0.3);
	}
	
	.profile-menu .dropdown-item {
		border-radius: 0;
	}
	
	.profile-menu .dropdown-item:first-of-type {
		margin-top: 8px;
	}
	
	.profile-menu .dropdown-item:last-of-type {
		margin-bottom: 8px;
	}
	
	.logout-item:hover {
		background: rgba(255, 100, 100, 0.1);
	}
	
	.logout-item:hover .item-icon,
	.logout-item:hover .item-name {
		color: rgba(255, 150, 150, 0.9);
	}
</style>
