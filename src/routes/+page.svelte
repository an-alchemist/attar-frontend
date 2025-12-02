<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import FlowCanvas from '$lib/components/FlowCanvas.svelte';
	import WorldNode from '$lib/components/WorldNode.svelte';
	import SatelliteNode from '$lib/components/SatelliteNode.svelte';
	import MailboxNode from '$lib/components/MailboxNode.svelte';
	import BackstoryNode from '$lib/components/BackstoryNode.svelte';
	import MemoryNode from '$lib/components/MemoryNode.svelte';
	import TimelineNode from '$lib/components/TimelineNode.svelte';
	import { onMount } from 'svelte';
	import { getLatestEnv, type CurrentEnv } from '$lib/stores/env';
	import { getLatestBackstory, type BackstoryEntry } from '$lib/stores/backstory';
	
	// Server data for OG meta tags
	let { data } = $props();
	
	let worldCenter = { x: 0, y: 0 };
	let flowInstance: any = null;
	let navigationFunctions: { navigateToNode: (nodeId: string) => void; returnToWorld: () => void } | null = null;

	let canvasElement: HTMLElement | null = $state(null);
	let mouseX = $state(0);
	let mouseY = $state(0);
	let currentEnv = $state<CurrentEnv | null>(null);
	let latestBackstory = $state<BackstoryEntry | null>(null);
	let loading = $state(true);

	const nodeTypes = {
		worldNode: WorldNode,
		satelliteNode: SatelliteNode,
		mailboxNode: MailboxNode,
		backstoryNode: BackstoryNode,
		memoryNode: MemoryNode,
		timelineNode: TimelineNode
	};

	let nodes = $state<any[]>([]);
	let edges = $state<any[]>([]);

	function handleMouseMove(event: MouseEvent) {
		if (canvasElement) {
			const rect = canvasElement.getBoundingClientRect();
			mouseX = event.clientX - rect.left;
			mouseY = event.clientY - rect.top;
		}
	}
	
	function navigateToNode(nodeId: string) {
		if (navigationFunctions) {
			navigationFunctions.navigateToNode(nodeId);
		}
	}
	
	function returnToWorld() {
		if (navigationFunctions) {
			navigationFunctions.returnToWorld();
		}
	}

	onMount(async () => {
		// Fetch latest environment and backstory from database
		loading = true;
		currentEnv = await getLatestEnv();
		latestBackstory = await getLatestBackstory();
		loading = false;
		
		const handleNavEvent = (e: Event) => {
			const customEvent = e as CustomEvent<{ nodeId: string }>;
			const nodeId = customEvent.detail.nodeId;
			
			// Retry if flowInstance isn't ready yet
			const tryNavigate = (attempts = 0) => {
				if (!flowInstance && attempts < 10) {
					setTimeout(() => tryNavigate(attempts + 1), 100);
					return;
				}
				
				if (nodeId === 'world') {
					returnToWorld();
				} else {
					navigateToNode(nodeId);
				}
			};
			
			tryNavigate();
		};
		window.addEventListener('navigate-to-node', handleNavEvent);
		
		// Setup nodes after a short delay to ensure DOM is ready
		setTimeout(() => {
			const container = document.querySelector('.canvas-container') as HTMLElement;
			if (!container) return;
			
			const vw = container.clientWidth;
			const vh = container.clientHeight;
			
			// Header offset - push content down visually
			const headerOffset = 40;
			
			// Hero dimensions
			const heroWidth = vw * 0.70;
			const heroHeight = vh * 0.75;
			
			// Position hero in flow coordinates (centered, but shifted down for header)
			const heroX = (vw - heroWidth) / 2;
			const heroY = (vh - heroHeight) / 2 + headerOffset;
			
			// Hero center in flow coordinates
			const centerX = heroX + heroWidth / 2;
			const centerY = heroY + heroHeight / 2;
			
			// Store for navigation back to world
			worldCenter = { x: centerX, y: centerY };
			
			// Use env data - no fallbacks
			if (!currentEnv) {
				console.error('No environment data found. Run seed first.');
				return;
			}
			
			const worldTitle = currentEnv.title;
			const worldImage = currentEnv.worldVideoUrl || currentEnv.worldImageUrl || '/worlds/be.png';
			const worldChoices = currentEnv.choices;
			const worldDay = currentEnv.day;
			const entityImage = currentEnv.entityImageUrl;
			const backstoryLine = latestBackstory?.text || '';
			const worldEnvId = currentEnv.id;
			
			// Satellite nodes positioned around hero
			const radius = Math.max(heroWidth, heroHeight) * 1.4;
			const satelliteConfigs = [
				{ id: 'backstory', type: 'backstoryNode', width: 320, height: 200, angle: -135, data: { label: 'Backstory', image: entityImage } },
				{ id: 'mailbox', type: 'mailboxNode', width: 320, height: 340, angle: -45, data: { label: 'Mailbox' } },
				{ id: 'memory', type: 'memoryNode', width: 360, height: 280, angle: 135, data: { label: 'Memory' } },
				{ id: 'timeline', type: 'timelineNode', width: 380, height: 450, angle: 45, data: { label: 'Timeline' } }
			];
			
			const satellites = satelliteConfigs.map(cfg => {
				const rad = (cfg.angle * Math.PI) / 180;
				return {
					id: cfg.id,
					position: { 
						x: centerX + Math.cos(rad) * radius - cfg.width / 2,
						y: centerY + Math.sin(rad) * radius - cfg.height / 2
					},
					data: cfg.data,
					type: cfg.type,
					width: cfg.width,
					height: cfg.height
				};
			});
			
			nodes = [
				{
					id: 'world',
					position: { x: heroX, y: heroY },
					data: { 
						title: worldTitle,
						image: worldImage,
						choices: worldChoices,
						day: worldDay,
						backstoryLine: backstoryLine,
						envId: worldEnvId
					},
					type: 'worldNode',
					width: heroWidth,
					height: heroHeight
				},
				...satellites
			];
			
			edges = [
				{ id: 'backstory', color: 'rgba(200, 230, 180, 0.5)', class: 'edge-pulse-1' },
				{ id: 'mailbox', color: 'rgba(147, 112, 219, 0.5)', class: 'edge-pulse-2' },
				{ id: 'memory', color: 'rgba(72, 209, 204, 0.5)', class: 'edge-pulse-3' },
				{ id: 'timeline', color: 'rgba(255, 182, 193, 0.5)', class: 'edge-pulse-4' }
			].map(e => ({
				id: `e-world-${e.id}`,
				source: 'world',
				sourceHandle: 'center',
				target: e.id,
				targetHandle: 'center',
				type: 'bezier',
				className: `edge-terminal ${e.class}`,
				style: `stroke: ${e.color}; stroke-width: 2;`
			}));
		}, 50);
		
		return () => {
			window.removeEventListener('navigate-to-node', handleNavEvent);
		};
	});
	
	// Dynamic page title
	const pageTitle = $derived(
		latestBackstory?.text 
			? `Attar, ${latestBackstory.text.slice(0, 60)}${latestBackstory.text.length > 60 ? '...' : ''}`
			: 'Attar'
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta property="og:title" content={pageTitle} />
	<meta property="og:image" content={data.ogImage} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:image" content={data.ogImage} />
	{#if latestBackstory?.text}
		<meta property="og:description" content={latestBackstory.text} />
		<meta name="description" content={latestBackstory.text} />
		<meta name="twitter:description" content={latestBackstory.text} />
	{/if}
</svelte:head>

<div 
	class="canvas-container relative w-full h-full bg-black overflow-hidden"
	onmousemove={handleMouseMove}
	bind:this={canvasElement}
	style="width: 100%; height: 100%; --mx: {mouseX}px; --my: {mouseY}px; --gap: 12px;"
>
	<!-- Static gray dot grid -->
	<div
		class="absolute inset-0 pointer-events-none"
		style="
			background-image:
				radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
			background-size: var(--gap) var(--gap);
			background-position: 0 0;
		"
	></div>
	<!-- Light hover effect -->
	<div
		class="absolute inset-0 pointer-events-none"
		style="
			mix-blend-mode: screen;
			background: radial-gradient(
				circle at var(--mx) var(--my),
				rgba(255,255,255,0.20) 0%,
				rgba(255,255,255,0.08) 20%,
				transparent 35%
			);
			opacity: .7;
		"
	></div>
	
	<!-- SvelteFlow canvas -->
	<div class="relative w-full h-full">
		<SvelteFlowProvider>
			<FlowCanvas 
				bind:nodes={nodes} 
				bind:edges={edges}
				nodeTypes={nodeTypes}
				worldCenter={worldCenter}
				bind:navigationFunctions={navigationFunctions}
			/>
		</SvelteFlowProvider>
	</div>
	
</div>

<style>
	:global(.svelte-flow) {
		background: transparent !important;
	}
	
	:global(.svelte-flow__background) {
		display: none;
	}
	
	:global(.svelte-flow__controls) {
		display: none;
	}
	
	:global(.svelte-flow__minimap) {
		display: none;
	}
	
	/* Smooth curved bezier edges with pulse animation */
	:global(.svelte-flow__edge-path) {
		stroke-linecap: round;
	}
	
	:global(.svelte-flow__edge) {
		opacity: 1;
	}
	
	:global(.edge-terminal) {
		filter: drop-shadow(0 0 6px rgba(200, 230, 180, 0.4));
	}
	
	/* Pulse animations - each edge has different timing */
	:global(.edge-pulse-1 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 3s linear infinite;
		filter: drop-shadow(0 0 8px rgba(200, 230, 180, 0.5));
	}
	
	:global(.edge-pulse-2 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 3.5s linear infinite;
		animation-delay: 0.5s;
		filter: drop-shadow(0 0 8px rgba(147, 112, 219, 0.5));
	}
	
	:global(.edge-pulse-3 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 4s linear infinite;
		animation-delay: 1s;
		filter: drop-shadow(0 0 8px rgba(72, 209, 204, 0.5));
	}
	
	:global(.edge-pulse-4 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 3.2s linear infinite;
		animation-delay: 1.5s;
		filter: drop-shadow(0 0 8px rgba(255, 182, 193, 0.5));
	}
	
	@keyframes pulse-flow {
		0% {
			stroke-dashoffset: 0;
		}
		100% {
			stroke-dashoffset: -40;
		}
	}
</style>
