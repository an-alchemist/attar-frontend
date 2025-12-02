<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	function returnToCenter() {
		dispatch('center');
	}
	
	function goToWorld() {
		dispatch('navigate', { nodeId: 'world' });
	}
</script>

<div class="dock-container">
	<div class="dock">
		<button 
			class="dock-btn"
			onclick={returnToCenter}
			title="Return to center"
		>
			<span class="dock-icon">⌖</span>
			<span class="dock-label">Center</span>
		</button>
		
		<div class="dock-divider"></div>
		
		<button 
			class="dock-btn primary"
			onclick={goToWorld}
			title="Go to World"
		>
			<span class="dock-icon">◆</span>
			<span class="dock-label">World</span>
		</button>
	</div>
</div>

<style>
	.dock-container {
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
	}
	
	.dock {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: linear-gradient(145deg, rgba(40, 35, 50, 0.95) 0%, rgba(25, 22, 32, 0.98) 100%);
		border: 1px solid rgba(120, 110, 130, 0.4);
		border-radius: 14px;
		box-shadow: 
			0 10px 40px rgba(0, 0, 0, 0.5),
			0 0 20px rgba(0, 0, 0, 0.3);
		font-family: 'JetBrains Mono', monospace;
	}
	
	.dock-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: rgba(200, 230, 180, 0.05);
		border: 1px solid rgba(200, 230, 180, 0.15);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.dock-btn:hover {
		background: rgba(200, 230, 180, 0.15);
		border-color: rgba(200, 230, 180, 0.3);
		transform: translateY(-2px);
	}
	
	.dock-btn.primary {
		background: rgba(200, 230, 180, 0.15);
		border-color: rgba(200, 230, 180, 0.3);
	}
	
	.dock-btn.primary:hover {
		background: rgba(200, 230, 180, 0.25);
		border-color: rgba(200, 230, 180, 0.5);
	}
	
	.dock-icon {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.8);
	}
	
	.dock-label {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.7);
	}
	
	.dock-btn:hover .dock-label {
		color: rgba(200, 230, 180, 0.95);
	}
	
	.dock-divider {
		width: 1px;
		height: 24px;
		background: rgba(200, 230, 180, 0.15);
	}
</style>



