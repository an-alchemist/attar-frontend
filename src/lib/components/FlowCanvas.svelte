<script lang="ts">
	import { SvelteFlow, useSvelteFlow } from '@xyflow/svelte';
	
	type Props = {
		nodes: any[];
		edges: any[];
		nodeTypes: any;
		worldCenter: { x: number; y: number };
		navigationFunctions?: { navigateToNode: (nodeId: string) => void; returnToWorld: () => void } | null;
	};
	
	let { nodes, edges, nodeTypes, worldCenter, navigationFunctions = $bindable(null) }: Props = $props();
	
	const { getNodes, setCenter } = useSvelteFlow();
	
	function navigateToNode(nodeId: string) {
		const allNodes = getNodes();
		const node = allNodes.find((n: any) => n.id === nodeId);
		if (!node) return;
		const x = node.position.x + (node.width || 0) / 2;
		const y = node.position.y + (node.height || 0) / 2;
		setCenter(x, y, { duration: 800, zoom: 1 });
	}
	
	function returnToWorld() {
		if (worldCenter.x !== 0) {
			setCenter(worldCenter.x, worldCenter.y, { duration: 800, zoom: 1 });
		}
	}
	
	// Expose navigation functions to parent via effect
	$effect(() => {
		navigationFunctions = { navigateToNode, returnToWorld };
	});
</script>

<SvelteFlow 
	bind:nodes={nodes} 
	bind:edges={edges}
	nodeTypes={nodeTypes}
	fitView={false}
	minZoom={0.2}
	maxZoom={2}
	proOptions={{ hideAttribution: true }}
/>

