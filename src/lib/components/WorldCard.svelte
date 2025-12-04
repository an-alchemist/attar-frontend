<script lang="ts">
	import { onMount } from 'svelte';
	import { isAuthenticated, profile, refreshProfile } from '$lib/stores/auth';
	import { voteOnDecision } from '$lib/stores/moons';
	import { isMobile } from '$lib/stores/mobile';
	import MobileBottomModal from './MobileBottomModal.svelte';
	
	type Choice = {
		id: string;
		title: string;
		description: string;
		votes: number;
	};
	
	type Props = {
		title: string;
		image: string;
		choices: Choice[];
		day?: number;
		backstoryLine?: string;
		envId?: string;
		onVoteSuccess?: () => void;
	};
	
	let { title, image, choices = $bindable(), day = 1, backstoryLine = '', envId = '', onVoteSuccess }: Props = $props();
	
	let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx: CanvasRenderingContext2D | null = null;
	let containerEl = $state<HTMLDivElement | null>(null);
	let mediaReady = $state(false);
	let mediaLoading = $state(true);
	let mediaError = $state(false);
	let retryCount = $state(0);
	const MAX_RETRIES = 3;
	let videoEl = $state<HTMLVideoElement | null>(null);
	let mouseX = $state(0);
	let mouseY = $state(0);
	let isHovering = $state(false);
	let selectedChoice = $state<Choice | null>(null);
	let showPopup = $state(false);
	let selectedMoons = $state(0);
	let customMoonAmount = $state('');
	let voting = $state(false);
	let voteError = $state('');
	let voteSuccess = $state('');
	
	const moonOptions = [1, 3, 5];
	
	// Detect if media is video
	const isVideo = $derived(image && (image.endsWith('.mp4') || image.endsWith('.webm') || image.endsWith('.mov')));
	
	// Vintage green-yellow color matching the terminal style
	const boxColor = { r: 200, g: 230, b: 180 };
	
	const boxPositions = [
		{ x: 0.12, y: 0.08 },
		{ x: 0.75, y: 0.12 },
		{ x: 0.06, y: 0.42 },
		{ x: 0.78, y: 0.58 },
		{ x: 0.18, y: 0.72 },
		{ x: 0.60, y: 0.75 },
		{ x: 0.40, y: 0.38 }
	];
	
	let boxes = $state<Array<{ x: number; y: number; width: number; height: number; choice: Choice }>>([]);
	
	function calculateTotalVotes() {
		return choices.reduce((sum, c) => sum + c.votes, 0);
	}
	
	function getVotePercentage(votes: number) {
		const total = calculateTotalVotes();
		if (total === 0) return 0;
		return Math.round((votes / total) * 100);
	}
	
	function handleCanvasClick(e: MouseEvent | TouchEvent) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		
		// Handle both mouse and touch events
		let clientX: number, clientY: number;
		if ('changedTouches' in e) {
			// Touch end event - use changedTouches
			if (e.changedTouches.length === 0) return;
			clientX = e.changedTouches[0].clientX;
			clientY = e.changedTouches[0].clientY;
			e.preventDefault(); // Prevent double-firing with click
		} else if ('touches' in e) {
			// Touch start/move event
			if (e.touches.length === 0) return;
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			// Mouse event
			clientX = e.clientX;
			clientY = e.clientY;
		}
		
		const clickX = (clientX - rect.left) * scaleX;
		const clickY = (clientY - rect.top) * scaleY;
		
		for (const box of boxes) {
			if (clickX >= box.x && clickX <= box.x + box.width &&
				clickY >= box.y && clickY <= box.y + box.height) {
				openVotePopup(box.choice);
				break;
			}
		}
	}
	
	function handleMouseMove(e: MouseEvent) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		mouseX = (e.clientX - rect.left) * scaleX;
		mouseY = (e.clientY - rect.top) * scaleY;
		isHovering = true;
	}
	
	function handleMouseLeave() {
		isHovering = false;
	}
	
	function openVotePopup(choice: Choice) {
		selectedChoice = choice;
		selectedMoons = 0;
		customMoonAmount = '';
		voteError = '';
		voteSuccess = '';
		showPopup = true;
	}
	
	function closePopup() {
		showPopup = false;
		selectedChoice = null;
		selectedMoons = 0;
		customMoonAmount = '';
		voteError = '';
		voteSuccess = '';
	}
	
	function selectMoons(amount: number) {
		if (amount === selectedMoons) {
			selectedMoons = 0;
		} else {
			selectedMoons = amount;
			customMoonAmount = '';
		}
	}
	
	function handleCustomInput() {
		const parsed = parseInt(customMoonAmount);
		if (!isNaN(parsed) && parsed > 0) {
			selectedMoons = parsed;
		} else {
			selectedMoons = 0;
		}
	}
	
	async function handleVote() {
		if (!selectedChoice || selectedMoons <= 0 || voting) return;
		if (!$isAuthenticated) {
			voteError = 'Please log in to vote';
			return;
		}
		if (!$profile || $profile.available_moons < selectedMoons) {
			voteError = 'Not enough moons';
			return;
		}
		if (!envId) {
			voteError = 'Environment not loaded';
			return;
		}
		
		voting = true;
		voteError = '';
		
		// Find choice index
		const choiceIndex = choices.findIndex(c => c.id === selectedChoice!.id);
		if (choiceIndex === -1) {
			voteError = 'Invalid choice';
			voting = false;
			return;
		}
		
		// Call backend
		const success = await voteOnDecision(envId, choiceIndex, selectedMoons);
		
		if (success) {
			// Update local vote count
			choices = choices.map((c, i) => 
				i === choiceIndex ? { ...c, votes: c.votes + selectedMoons } : c
			);
			
			voteSuccess = `Voted with ${selectedMoons} 🌙`;
			
			// Refresh profile to get updated moon count
			await refreshProfile();
			
			if (onVoteSuccess) {
				onVoteSuccess();
			}
			
			setTimeout(() => {
				closePopup();
				voting = false;
				voteSuccess = '';
			}, 1200);
		} else {
			voteError = 'Failed to vote. Please try again.';
			voting = false;
		}
	}
	
	function drawFrame() {
		if (!ctx || !mediaReady || !canvas) return;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// Only draw image if not video (video is behind canvas)
		if (!isVideo && img) {
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		}
		
		// Draw lines from mouse to each box when hovering
		if (isHovering) {
			ctx.strokeStyle = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, 0.3)`;
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 6]);
			
			for (const box of boxes) {
				const boxCenterX = box.x + box.width / 2;
				const boxCenterY = box.y + box.height / 2;
				ctx.beginPath();
				ctx.moveTo(mouseX, mouseY);
				ctx.lineTo(boxCenterX, boxCenterY);
				ctx.stroke();
			}
			ctx.setLineDash([]);
			
			ctx.fillStyle = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, 0.6)`;
			ctx.beginPath();
			ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2);
			ctx.fill();
		}
		
		// Draw calming green boxes with in/out breathing effect
		const time = Date.now();
		const fontSize = Math.max(10, canvas.width * 0.012);
		
		boxes.forEach((box, index) => {
			// Smooth breathing in/out effect - each box slightly offset
			const breathe = Math.sin(time / 2000 + index * 0.6) * 0.5 + 0.5; // 0 to 1
			const alpha = 0.4 + breathe * 0.5; // 0.4 to 0.9
			const glowIntensity = 8 + breathe * 12; // 8 to 20
			
			ctx.strokeStyle = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, ${alpha})`;
			ctx.lineWidth = 2;
			ctx.shadowBlur = glowIntensity;
			ctx.shadowColor = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, ${alpha * 0.7})`;
			ctx.strokeRect(box.x, box.y, box.width, box.height);
			
			// Corner markers
			const markerSize = 5;
			ctx.fillStyle = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, ${alpha})`;
			ctx.fillRect(box.x - markerSize/2, box.y - markerSize/2, markerSize, markerSize);
			ctx.fillRect(box.x + box.width - markerSize/2, box.y - markerSize/2, markerSize, markerSize);
			ctx.fillRect(box.x - markerSize/2, box.y + box.height - markerSize/2, markerSize, markerSize);
			ctx.fillRect(box.x + box.width - markerSize/2, box.y + box.height - markerSize/2, markerSize, markerSize);
			
			ctx.shadowBlur = 0;
			
			// Draw label above box
			ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
			ctx.fillStyle = `rgba(${boxColor.r}, ${boxColor.g}, ${boxColor.b}, 0.9)`;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'bottom';
			ctx.fillText(box.choice.title, box.x, box.y - 6);
		});
		
		requestAnimationFrame(drawFrame);
	}
	
	let img: HTMLImageElement;
	
	function setupCanvasWithDimensions(width: number, height: number) {
		if (!canvas || !containerEl) return;
		
		const containerWidth = containerEl.clientWidth;
		const aspectRatio = height / width;
		const canvasWidth = containerWidth;
		const canvasHeight = containerWidth * aspectRatio;
		
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		
		const boxWidth = canvasWidth * 0.10;
		const boxHeight = canvasHeight * 0.08;
		
		boxes = choices.slice(0, 7).map((choice, i) => ({
			x: boxPositions[i].x * canvasWidth,
			y: boxPositions[i].y * canvasHeight,
			width: boxWidth,
			height: boxHeight,
			choice
		}));
		
		mediaReady = true;
		mediaLoading = false;
		mediaError = false;
		ctx = canvas.getContext('2d');
		drawFrame();
	}
	
	function handleMediaError() {
		if (retryCount < MAX_RETRIES) {
			retryCount++;
			// Retry after a short delay
			setTimeout(() => {
				setupCanvas();
			}, 1000 * retryCount); // Exponential backoff: 1s, 2s, 3s
		} else {
			mediaLoading = false;
			mediaError = true;
		}
	}
	
	function retryMediaLoad() {
		retryCount = 0;
		mediaError = false;
		mediaLoading = true;
		setupCanvas();
	}
	
	function setupCanvas() {
		if (!canvas || !containerEl) return;
		
		mediaLoading = true;
		mediaError = false;
		
		if (isVideo) {
			// For video, we wait for the video element to load metadata
			// The video element will call setupCanvasWithDimensions when ready
		} else {
			img = new Image();
			img.onload = () => {
				setupCanvasWithDimensions(img.naturalWidth, img.naturalHeight);
			};
			img.onerror = () => {
				handleMediaError();
			};
			// Add cache buster on retry
			img.src = retryCount > 0 ? `${image}?retry=${retryCount}` : image;
		}
	}
	
	function handleVideoLoaded() {
		if (videoEl) {
			setupCanvasWithDimensions(videoEl.videoWidth, videoEl.videoHeight);
			// Start monitoring for smooth loop transition
			startLoopFadeMonitor();
		}
	}
	
	function handleVideoError() {
		handleMediaError();
	}
	
	let fadeInterval: ReturnType<typeof setInterval> | null = null;
	
	function startLoopFadeMonitor() {
		if (!videoEl || fadeInterval) return;
		
		fadeInterval = setInterval(() => {
			if (!videoEl) return;
			const timeLeft = videoEl.duration - videoEl.currentTime;
			const fadeStart = 0.8; // Start fade 0.8s before end
			
			if (timeLeft <= fadeStart && timeLeft > 0) {
				// Fade out as we approach the end
				const opacity = timeLeft / fadeStart;
				videoEl.style.opacity = String(Math.max(0.3, opacity));
			} else if (videoEl.currentTime < 0.5) {
				// Fade in at the start
				const opacity = 0.3 + (videoEl.currentTime / 0.5) * 0.7;
				videoEl.style.opacity = String(Math.min(1, opacity));
			} else {
				videoEl.style.opacity = '1';
			}
		}, 50);
	}
	
	onMount(() => {
		setupCanvas();
		
		return () => {
			// Cleanup fade monitor on unmount
			if (fadeInterval) {
				clearInterval(fadeInterval);
				fadeInterval = null;
			}
		};
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<div class="world-card-container w-full flex flex-col">
	<!-- Terminal-style window -->
	<div class="terminal-window rounded-lg overflow-hidden" style="background: linear-gradient(145deg, rgba(80, 70, 90, 0.9) 0%, rgba(60, 55, 70, 0.95) 100%); border: 1px solid rgba(120, 110, 130, 0.4);">
		
		<!-- Window header -->
		<div class="flex items-center justify-between px-4 py-3" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
			<div class="text-sm tracking-wide" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.9);">
				{title}
			</div>
			<div class="text-xs px-2 py-0.5 rounded" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.6); border: 1px solid rgba(200, 230, 180, 0.3);">
				Day {day}
			</div>
		</div>
		
		<!-- Main content with video/canvas -->
		<div 
			bind:this={containerEl}
			class="relative w-full p-4"
		>
			<!-- Loading state -->
			{#if mediaLoading && !mediaReady}
				<div class="loading-container">
					<div class="loading-spinner"></div>
					<div class="loading-text">
						{#if retryCount > 0}
							Retrying ({retryCount}/{MAX_RETRIES})...
						{:else}
							Loading world...
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Error state -->
			{#if mediaError}
				<div class="error-container">
					<div class="error-icon">⚠</div>
					<div class="error-text">Failed to load media</div>
					<button class="retry-btn" onclick={retryMediaLoad}>
						↻ Retry
					</button>
				</div>
			{/if}
			
			{#if isVideo}
				<!-- Video background with smooth loop fade -->
				<video
					bind:this={videoEl}
					src={retryCount > 0 ? `${image}?retry=${retryCount}` : image}
					autoplay
					loop
					muted
					playsinline
					onloadedmetadata={handleVideoLoaded}
					onerror={handleVideoError}
					class="video-loop w-full h-auto block rounded"
					class:opacity-0={mediaLoading || mediaError}
				></video>
				<!-- Transparent canvas overlay for interactive elements -->
				<canvas
					bind:this={canvas}
					onclick={handleCanvasClick}
					ontouchend={handleCanvasClick}
					onmousemove={handleMouseMove}
					onmouseleave={handleMouseLeave}
					class="absolute top-4 left-4 right-4 cursor-pointer rounded touch-none"
					style="width: calc(100% - 2rem); height: auto;"
					class:opacity-0={mediaLoading || mediaError}
				></canvas>
			{:else}
				<!-- Image mode: canvas draws everything -->
				<canvas
					bind:this={canvas}
					onclick={handleCanvasClick}
					ontouchend={handleCanvasClick}
					onmousemove={handleMouseMove}
					onmouseleave={handleMouseLeave}
					class="w-full h-auto cursor-pointer block rounded touch-none"
					class:opacity-0={mediaLoading || mediaError}
				></canvas>
			{/if}
		</div>
		
		<!-- Footer -->
		<div class="px-4 py-3" style="background: rgba(0,0,0,0.15); border-top: 1px solid rgba(120, 110, 130, 0.2);">
			<div class="text-sm tracking-wider" style="font-family: 'JetBrains Mono', monospace; color: rgba(200, 230, 180, 0.7);">
				{backstoryLine}
			</div>
		</div>
	</div>
	
	<!-- Voting buttons - horizontal row below terminal -->
	<div class="w-full mt-4 flex flex-wrap gap-2 justify-center">
		{#each choices.slice(0, 7) as choice (choice.id)}
			<button
				onclick={() => openVotePopup(choice)}
				class="flex items-center gap-2 px-3 py-1.5 rounded transition-all text-xs hover:scale-105"
				style="font-family: 'JetBrains Mono', monospace; background: rgba(80, 70, 90, 0.6); border: 1px solid rgba(200, 230, 180, 0.2); color: rgba(200, 230, 180, 0.8);"
			>
				<span>{choice.title}</span>
				<span style="color: rgba(200, 230, 180, 0.5);">{getVotePercentage(choice.votes)}%</span>
			</button>
		{/each}
	</div>
</div>

<!-- Moon Voting Popup -->
{#if showPopup && selectedChoice}
	{#if $isMobile}
		<!-- Mobile: Bottom sheet modal -->
		<MobileBottomModal open={showPopup} onClose={closePopup} title={selectedChoice.title}>
			<div class="vote-modal-content" style="font-family: 'JetBrains Mono', monospace;">
				<!-- Choice info -->
				<div class="vote-choice-header">
					<div class="vote-percentage-badge">
						{getVotePercentage(selectedChoice.votes)}%
					</div>
					<p class="vote-description">{selectedChoice.description}</p>
				</div>
				
				<!-- Moon voting section -->
				{#if $isAuthenticated}
					<div class="vote-section">
						<div class="vote-balance-row">
							<span>Vote with 🌙</span>
							<span class="balance">Balance: {$profile?.available_moons ?? 0}</span>
						</div>
						
						<div class="vote-buttons">
							{#each moonOptions as amount}
								<button
									onclick={() => selectMoons(amount)}
									disabled={voting || ($profile && $profile.available_moons < amount)}
									class="vote-amount-btn"
									class:selected={selectedMoons === amount}
									class:disabled={$profile && $profile.available_moons < amount}
								>
									{amount} 🌙
								</button>
							{/each}
							<input
								type="number"
								bind:value={customMoonAmount}
								oninput={handleCustomInput}
								placeholder="?"
								min="1"
								max={$profile?.available_moons ?? 0}
								disabled={voting}
								class="vote-custom-input"
								class:has-value={customMoonAmount}
							/>
						</div>
						
						{#if voteError}
							<div class="vote-error">{voteError}</div>
						{/if}
						{#if voteSuccess}
							<div class="vote-success">{voteSuccess}</div>
						{/if}
						
						<div class="vote-actions">
							<button onclick={closePopup} disabled={voting} class="vote-cancel-btn">
								Cancel
							</button>
							{#if selectedMoons > 0}
								<button
									onclick={handleVote}
									disabled={voting || !$profile || $profile.available_moons < selectedMoons}
									class="vote-submit-btn"
									class:voting={voting}
								>
									{#if voting}
										Voting...
									{:else}
										Vote {selectedMoons} 🌙
									{/if}
								</button>
							{/if}
						</div>
					</div>
				{:else}
					<div class="vote-login-prompt">
						<p>Log in to vote on decisions</p>
						<button onclick={closePopup} class="vote-cancel-btn full">Close</button>
					</div>
				{/if}
			</div>
		</MobileBottomModal>
	{:else}
		<!-- Desktop: Centered modal -->
		<div 
			class="fixed inset-0 bg-black/85 flex items-center justify-center z-50"
			onclick={closePopup}
			onkeydown={(e) => e.key === 'Escape' && closePopup()}
			role="dialog"
			tabindex="-1"
		>
			<div 
				class="rounded-lg max-w-md w-full mx-4 overflow-hidden"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="document"
				style="background: linear-gradient(145deg, rgba(35, 30, 45, 0.98) 0%, rgba(20, 18, 28, 1) 100%); border: 1px solid rgba(120, 110, 130, 0.5); font-family: 'JetBrains Mono', monospace; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);"
			>
				<!-- Modal header -->
				<div class="flex items-center justify-between px-4 py-3" style="background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(120, 110, 130, 0.3);">
					<div class="flex items-center gap-3">
						<div class="flex items-center justify-center w-10 h-10 rounded-lg" style="background: rgba(72, 209, 204, 0.15); border: 1px solid rgba(72, 209, 204, 0.3);">
							<span class="text-sm" style="color: rgba(72, 209, 204, 0.9);">
								{getVotePercentage(selectedChoice.votes)}%
							</span>
						</div>
						<span style="color: rgba(200, 230, 180, 0.9);">{selectedChoice.title}</span>
					</div>
					<button 
						onclick={closePopup}
						class="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white/10" 
						style="border: 1px solid rgba(200, 230, 180, 0.3); color: rgba(200, 230, 180, 0.6);"
					>
						<span style="font-size: 16px;">×</span>
					</button>
				</div>
				
				<!-- Modal content -->
				<div class="p-4">
					<p class="text-sm leading-relaxed mb-4" style="color: rgba(200, 230, 180, 0.7);">{selectedChoice.description}</p>
					
					<!-- Moon voting section -->
					{#if $isAuthenticated}
						<div class="flex items-center justify-between mb-3">
							<span class="text-xs" style="color: rgba(200, 230, 180, 0.6);">
								Vote with 🌙
							</span>
							<span class="text-xs" style="color: rgba(200, 230, 180, 0.4);">
								Balance: {$profile?.available_moons ?? 0}
							</span>
						</div>
						
						<div class="flex items-center gap-2 mb-3">
							{#each moonOptions as amount}
								<button
									onclick={() => selectMoons(amount)}
									disabled={voting || ($profile && $profile.available_moons < amount)}
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
								bind:value={customMoonAmount}
								oninput={handleCustomInput}
								placeholder="?"
								min="1"
								max={$profile?.available_moons ?? 0}
								disabled={voting}
								class="w-14 py-2 px-2 rounded text-xs text-center outline-none"
								style="
									background: {customMoonAmount ? 'rgba(200, 230, 180, 0.15)' : 'rgba(0,0,0,0.2)'};
									border: 1px solid {customMoonAmount ? 'rgba(200, 230, 180, 0.5)' : 'rgba(120, 110, 130, 0.3)'};
									color: rgba(200, 230, 180, 0.8);
								"
							/>
						</div>
						
						{#if voteError}
							<div class="text-xs mb-2" style="color: rgba(255, 150, 150, 0.9);">{voteError}</div>
						{/if}
						{#if voteSuccess}
							<div class="text-xs mb-2" style="color: rgba(150, 255, 150, 0.9);">{voteSuccess}</div>
						{/if}
						
						<div class="flex gap-2">
							<button
								onclick={closePopup}
								disabled={voting}
								class="flex-1 py-2.5 rounded text-sm transition-all"
								style="border: 1px solid rgba(200, 230, 180, 0.3); color: rgba(200, 230, 180, 0.7);"
							>
								Cancel
							</button>
							{#if selectedMoons > 0}
								<button
									onclick={handleVote}
									disabled={voting || !$profile || $profile.available_moons < selectedMoons}
									class="flex-1 py-2.5 rounded text-sm transition-all"
									style="
										background: rgba(200, 230, 180, 0.2);
										color: rgba(200, 230, 180, 0.9);
										border: 1px solid rgba(200, 230, 180, 0.4);
										opacity: {voting ? 0.6 : 1};
									"
								>
									{#if voting}
										Voting...
									{:else}
										Vote {selectedMoons} 🌙
									{/if}
								</button>
							{/if}
						</div>
					{:else}
						<div class="text-xs text-center py-4" style="color: rgba(200, 230, 180, 0.5);">
							Log in to vote on decisions
						</div>
						<button
							onclick={closePopup}
							class="w-full py-2.5 rounded text-sm transition-all"
							style="border: 1px solid rgba(200, 230, 180, 0.3); color: rgba(200, 230, 180, 0.7);"
						>
							Close
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.video-loop {
		transition: opacity 0.15s ease-out;
	}
	
	.opacity-0 {
		opacity: 0;
	}
	
	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	input[type="number"] {
		-moz-appearance: textfield;
	}
	
	/* Touch device optimizations */
	.touch-none {
		touch-action: none;
	}
	
	/* Loading state */
	.loading-container {
		position: absolute;
		inset: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 8px;
		z-index: 5;
	}
	
	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 3px solid rgba(200, 230, 180, 0.2);
		border-top-color: rgba(200, 230, 180, 0.8);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.loading-text {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.7);
		animation: pulse-text 1.5s ease-in-out infinite;
	}
	
	@keyframes pulse-text {
		0%, 100% { opacity: 0.7; }
		50% { opacity: 1; }
	}
	
	/* Error state */
	.error-container {
		position: absolute;
		inset: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		z-index: 5;
	}
	
	.error-icon {
		font-size: 36px;
		color: rgba(255, 180, 150, 0.8);
	}
	
	.error-text {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		color: rgba(255, 180, 150, 0.9);
	}
	
	.retry-btn {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		padding: 10px 20px;
		color: rgba(200, 230, 180, 0.9);
		background: rgba(200, 230, 180, 0.15);
		border: 1px solid rgba(200, 230, 180, 0.4);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.retry-btn:hover {
		background: rgba(200, 230, 180, 0.25);
		transform: scale(1.05);
	}
	
	/* Mobile responsive adjustments */
	@media (max-width: 767px) {
		.world-card-container :global(.terminal-window) {
			border-radius: 12px;
		}
		
		/* Larger touch targets for voting buttons on mobile */
		.world-card-container :global(button) {
			min-height: 44px;
			min-width: 44px;
		}
	}
	
	/* Mobile vote modal styles */
	.vote-modal-content {
		padding: 20px;
	}
	
	.vote-choice-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid rgba(120, 110, 130, 0.2);
	}
	
	.vote-percentage-badge {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		font-size: 16px;
		background: rgba(72, 209, 204, 0.15);
		border: 1px solid rgba(72, 209, 204, 0.3);
		color: rgba(72, 209, 204, 0.9);
		flex-shrink: 0;
	}
	
	.vote-description {
		font-size: 14px;
		line-height: 1.5;
		color: rgba(200, 230, 180, 0.7);
		margin: 0;
	}
	
	.vote-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.vote-balance-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 13px;
		color: rgba(200, 230, 180, 0.6);
	}
	
	.vote-balance-row .balance {
		color: rgba(200, 230, 180, 0.4);
	}
	
	.vote-buttons {
		display: flex;
		gap: 10px;
	}
	
	.vote-amount-btn {
		flex: 1;
		padding: 14px 8px;
		border-radius: 10px;
		font-size: 14px;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(120, 110, 130, 0.3);
		color: rgba(200, 230, 180, 0.8);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.vote-amount-btn.selected {
		background: rgba(200, 230, 180, 0.25);
		border-color: rgba(200, 230, 180, 0.5);
	}
	
	.vote-amount-btn.disabled {
		color: rgba(200, 230, 180, 0.3);
		cursor: not-allowed;
	}
	
	.vote-amount-btn:active:not(.disabled) {
		transform: scale(0.97);
	}
	
	.vote-custom-input {
		width: 64px;
		padding: 14px 8px;
		border-radius: 10px;
		font-size: 14px;
		text-align: center;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(120, 110, 130, 0.3);
		color: rgba(200, 230, 180, 0.8);
		outline: none;
		-moz-appearance: textfield;
	}
	
	.vote-custom-input::-webkit-inner-spin-button,
	.vote-custom-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	.vote-custom-input.has-value {
		background: rgba(200, 230, 180, 0.15);
		border-color: rgba(200, 230, 180, 0.5);
	}
	
	.vote-error {
		font-size: 13px;
		color: rgba(255, 150, 150, 0.9);
		padding: 8px 12px;
		background: rgba(255, 100, 100, 0.1);
		border-radius: 8px;
	}
	
	.vote-success {
		font-size: 13px;
		color: rgba(150, 255, 150, 0.9);
		padding: 8px 12px;
		background: rgba(100, 255, 100, 0.1);
		border-radius: 8px;
	}
	
	.vote-actions {
		display: flex;
		gap: 12px;
		margin-top: 8px;
	}
	
	.vote-cancel-btn {
		flex: 1;
		padding: 16px;
		border-radius: 12px;
		font-size: 15px;
		background: transparent;
		border: 1px solid rgba(200, 230, 180, 0.3);
		color: rgba(200, 230, 180, 0.7);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.vote-cancel-btn.full {
		margin-top: 16px;
	}
	
	.vote-cancel-btn:active {
		background: rgba(200, 230, 180, 0.1);
		transform: scale(0.98);
	}
	
	.vote-submit-btn {
		flex: 1;
		padding: 16px;
		border-radius: 12px;
		font-size: 15px;
		background: rgba(200, 230, 180, 0.2);
		border: 1px solid rgba(200, 230, 180, 0.4);
		color: rgba(200, 230, 180, 0.9);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.vote-submit-btn.voting {
		opacity: 0.6;
	}
	
	.vote-submit-btn:active:not(.voting) {
		background: rgba(200, 230, 180, 0.3);
		transform: scale(0.98);
	}
	
	.vote-login-prompt {
		text-align: center;
		padding: 24px 0;
	}
	
	.vote-login-prompt p {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.5);
		margin: 0 0 20px 0;
	}
</style>
