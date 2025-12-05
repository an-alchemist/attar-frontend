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
	import MobileWorldView from '$lib/components/MobileWorldView.svelte';
	import { onMount } from 'svelte';
	import { isMobile } from '$lib/stores/mobile';
	import { appData, setAppData } from '$lib/state.svelte';

	// Get data from server load function - NO MORE onMount FETCHING!
	let { data } = $props();

	let worldCenter = { x: 0, y: 0 };
	let navigationFunctions: { navigateToNode: (nodeId: string) => void; returnToWorld: () => void } | null = null;
	let canvasElement: HTMLElement | null = $state(null);
	let mouseX = $state(0);
	let mouseY = $state(0);

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

	// Throttled mouse move
	let lastMouseUpdate = 0;
	let cachedCanvasRect: DOMRect | null = null;

	function handleMouseMove(event: MouseEvent) {
		const now = Date.now();
		if (now - lastMouseUpdate < 50) return;
		lastMouseUpdate = now;

		if (canvasElement) {
			if (!cachedCanvasRect) {
				cachedCanvasRect = canvasElement.getBoundingClientRect();
			}
			mouseX = event.clientX - cachedCanvasRect.left;
			mouseY = event.clientY - cachedCanvasRect.top;
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

	onMount(() => {
		// Update global state with server data (for other components to use)
		if (data.currentEnv) {
			setAppData({
				currentEnv: data.currentEnv,
				latestBackstory: data.latestBackstory
			});
		}

		// Setup flow nodes
		const container = document.querySelector('.canvas-container') as HTMLElement;
		if (!container || !data.currentEnv) return;

		const vw = container.clientWidth;
		const vh = container.clientHeight;
		const headerOffset = 40;
		const heroWidth = vw * 0.70;
		const heroHeight = vh * 0.75;
		const heroX = (vw - heroWidth) / 2;
		const heroY = (vh - heroHeight) / 2 + headerOffset;
		const centerX = heroX + heroWidth / 2;
		const centerY = heroY + heroHeight / 2;

		worldCenter = { x: centerX, y: centerY };

		const worldImage = data.currentEnv.worldVideoUrl || data.currentEnv.worldImageUrl || '/worlds/be.png';

		const radius = Math.max(heroWidth, heroHeight) * 1.4;
		const satelliteConfigs = [
			{ id: 'backstory', type: 'backstoryNode', width: 320, height: 200, angle: -135, data: { label: 'Backstory', image: data.currentEnv.entityImageUrl } },
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
					title: data.currentEnv.title,
					image: worldImage,
					choices: data.currentEnv.choices,
					day: data.currentEnv.day,
					backstoryLine: data.latestBackstory?.text || '',
					envId: data.currentEnv.id
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

		// Listen for navigation events
		const handleNavEvent = (e: Event) => {
			const customEvent = e as CustomEvent<{ nodeId: string }>;
			const nodeId = customEvent.detail.nodeId;

			if (nodeId === 'world') {
				returnToWorld();
			} else {
				navigateToNode(nodeId);
			}
		};
		window.addEventListener('navigate-to-node', handleNavEvent);

		return () => {
			window.removeEventListener('navigate-to-node', handleNavEvent);
		};
	});

	// Dynamic page title
	const pageTitle = $derived(
		data.latestBackstory?.text
			? `Attar - ${data.latestBackstory.text.slice(0, 60)}${data.latestBackstory.text.length > 60 ? '...' : ''}`
			: 'Attar - An Evolving Entity'
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta property="og:title" content={pageTitle} />
	<meta property="og:image" content={data.ogImage} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://attarglitch.com" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:image" content={data.ogImage} />
	<meta property="og:description" content={data.latestBackstory?.text || data.ogDescription} />
	<meta name="description" content={data.latestBackstory?.text || data.ogDescription} />
	<meta name="twitter:description" content={data.latestBackstory?.text || data.ogDescription} />
</svelte:head>

<!-- Mobile View -->
{#if $isMobile && data.currentEnv}
	<MobileWorldView
		currentEnv={data.currentEnv}
		latestBackstory={data.latestBackstory}
	/>
<!-- Desktop View -->
{:else}
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
{/if}

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

	:global(.svelte-flow__edge-path) {
		stroke-linecap: round;
	}

	:global(.svelte-flow__edge) {
		opacity: 1;
	}

	/* Simple edge styling - NO expensive drop-shadow */
	:global(.edge-terminal) {
		opacity: 0.8;
	}

	/* Pulse animations - lighter, no filter */
	:global(.edge-pulse-1 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 4s linear infinite;
	}

	:global(.edge-pulse-2 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 5s linear infinite;
	}

	:global(.edge-pulse-3 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 6s linear infinite;
	}

	:global(.edge-pulse-4 .svelte-flow__edge-path) {
		stroke-dasharray: 8 12;
		animation: pulse-flow 4.5s linear infinite;
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
