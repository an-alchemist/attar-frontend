<script lang="ts">
	import { onMount } from 'svelte';
	
	type Props = {
		open: boolean;
		onClose: () => void;
		title?: string;
	};
	
	let { open, onClose, title = '' }: Props = $props();
	
	let modalEl: HTMLDivElement | null = null;
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
	
	onMount(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});
	
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div 
		class="modal-backdrop"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="modal-content"
			bind:this={modalEl}
			onclick={(e) => e.stopPropagation()}
		>
			{#if title}
				<div class="modal-header">
					<span class="modal-title">{title}</span>
					<button class="close-btn" onclick={onClose} aria-label="Close">
						×
					</button>
				</div>
			{:else}
				<button class="close-btn-floating" onclick={onClose} aria-label="Close">
					×
				</button>
			{/if}
			
			<div class="modal-body">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		animation: fadeIn 0.2s ease;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	.modal-content {
		position: relative;
		width: 100%;
		max-height: 85vh;
		background: linear-gradient(145deg, rgba(35, 30, 45, 0.98) 0%, rgba(20, 18, 28, 1) 100%);
		border-top: 1px solid rgba(120, 110, 130, 0.5);
		border-radius: 20px 20px 0 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.25s ease;
		padding-bottom: env(safe-area-inset-bottom, 0);
	}
	
	@keyframes slideUp {
		from { 
			transform: translateY(100%);
			opacity: 0.5;
		}
		to { 
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(120, 110, 130, 0.3);
		background: rgba(0, 0, 0, 0.2);
	}
	
	.modal-title {
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		color: rgba(200, 230, 180, 0.9);
	}
	
	.close-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		color: rgba(200, 230, 180, 0.6);
		background: rgba(200, 230, 180, 0.1);
		border: 1px solid rgba(200, 230, 180, 0.3);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.close-btn:active {
		background: rgba(200, 230, 180, 0.2);
		transform: scale(0.95);
	}
	
	.close-btn-floating {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		color: rgba(200, 230, 180, 0.6);
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(200, 230, 180, 0.3);
		border-radius: 8px;
		cursor: pointer;
		z-index: 1;
		transition: all 0.2s;
	}
	
	.close-btn-floating:active {
		background: rgba(200, 230, 180, 0.2);
		transform: scale(0.95);
	}
	
	.modal-body {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}
</style>

