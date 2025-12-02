<script lang="ts">
	import { signUp, signIn, authError } from '$lib/stores/auth';

	type Props = {
		onClose: () => void;
	};

	let { onClose }: Props = $props();

	let mode = $state<'login' | 'signup'>('login');
	let email = $state('');
	let password = $state('');
	let pseudoname = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	let showConfirmation = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		loading = true;

		try {
			if (mode === 'signup') {
				const result = await signUp(email, password, pseudoname || undefined);
				
				if (result.confirmEmail) {
					// Email confirmation required
					showConfirmation = true;
					success = 'Check your email to confirm your account!';
				} else if (result.session) {
					// Direct login (no confirmation required)
					onClose();
				}
			} else {
				await signIn(email, password);
				onClose();
			}
		} catch (err: any) {
			error = err.message || 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function switchMode() {
		mode = mode === 'login' ? 'signup' : 'login';
		error = '';
		success = '';
		showConfirmation = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function tryLogin() {
		// Switch to login mode after confirmation
		mode = 'login';
		showConfirmation = false;
		success = '';
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div 
	class="auth-overlay"
	onclick={onClose}
	onkeydown={handleKeydown}
	role="dialog"
	tabindex="-1"
>
	<div 
		class="auth-modal"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="document"
	>
		<!-- Header -->
		<div class="modal-header">
			<div class="header-left">
				<span class="header-icon">◆</span>
				<span class="header-title">
					{#if showConfirmation}
						Check Your Email
					{:else}
						{mode === 'login' ? 'Welcome Back' : 'Join Attar'}
					{/if}
				</span>
			</div>
			<button class="close-btn" onclick={onClose}>
				<span>×</span>
			</button>
		</div>

		<!-- Email confirmation screen -->
		{#if showConfirmation}
			<div class="modal-content">
				<div class="confirmation-box">
					<span class="confirmation-icon">✉</span>
					<h3 class="confirmation-title">Confirm Your Email</h3>
					<p class="confirmation-text">
						We've sent a confirmation link to <strong>{email}</strong>
					</p>
					<p class="confirmation-hint">
						Click the link in the email to activate your account, then come back here to log in.
					</p>
				</div>
				
				<button type="button" class="submit-btn" onclick={tryLogin}>
					<span class="btn-icon">→</span>
					<span>Continue to Login</span>
				</button>
			</div>
		{:else}
			<!-- Content -->
			<form class="modal-content" onsubmit={handleSubmit}>
				<!-- Terminal prompt -->
				<div class="terminal-prompt">
					<span class="prompt-symbol">></span>
					<span class="prompt-text">
						{mode === 'login' ? 'auth.login()' : 'auth.create()'}
					</span>
					<span class="cursor"></span>
				</div>

				{#if error}
					<div class="error-message">
						<span class="error-icon">⚠</span>
						<span>{error}</span>
					</div>
				{/if}

				{#if success && !showConfirmation}
					<div class="success-message">
						<span class="success-icon">✓</span>
						<span>{success}</span>
					</div>
				{/if}

				{#if mode === 'signup'}
					<div class="form-field">
						<label for="pseudoname">
							<span class="field-label">pseudoname</span>
							<span class="field-optional">(optional)</span>
						</label>
						<input
							type="text"
							id="pseudoname"
							bind:value={pseudoname}
							placeholder="Anonymous"
							maxlength="50"
							autocomplete="username"
							disabled={loading}
						/>
					</div>
				{/if}

				<div class="form-field">
					<label for="email">
						<span class="field-label">email</span>
						<span class="field-required">*</span>
					</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						autocomplete="email"
						disabled={loading}
					/>
				</div>

				<div class="form-field">
					<label for="password">
						<span class="field-label">password</span>
						<span class="field-required">*</span>
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="••••••••"
						required
						minlength="6"
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
						disabled={loading}
					/>
					{#if mode === 'signup'}
						<span class="field-hint">Min 6 characters</span>
					{/if}
				</div>

				<button type="submit" class="submit-btn" disabled={loading}>
					{#if loading}
						<span class="loading-spinner"></span>
						<span>Processing...</span>
					{:else}
						<span class="btn-icon">→</span>
						<span>{mode === 'login' ? 'Enter' : 'Create Account'}</span>
					{/if}
				</button>

				{#if mode === 'signup'}
					<div class="moon-reward">
						<span class="moon-icon">🌙</span>
						<span>You'll receive <strong>13 moons</strong> daily to vote and interact</span>
					</div>
				{/if}
			</form>

			<!-- Footer -->
			<div class="modal-footer">
				<span class="footer-text">
					{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
				</span>
				<button class="switch-btn" onclick={switchMode} disabled={loading}>
					{mode === 'login' ? 'Sign Up' : 'Log In'}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		font-family: 'JetBrains Mono', monospace;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.auth-modal {
		background: linear-gradient(145deg, rgba(35, 30, 45, 0.98) 0%, rgba(20, 18, 28, 1) 100%);
		border: 1px solid rgba(120, 110, 130, 0.5);
		border-radius: 16px;
		width: 90vw;
		max-width: 420px;
		overflow: hidden;
		box-shadow: 
			0 25px 80px rgba(0, 0, 0, 0.6),
			0 0 60px rgba(200, 230, 180, 0.05);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(20px);
		}
		to { 
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(120, 110, 130, 0.3);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.header-icon {
		font-size: 18px;
		color: rgba(200, 230, 180, 0.9);
	}

	.header-title {
		font-size: 16px;
		color: rgba(200, 230, 180, 0.95);
		font-weight: 500;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border: 1px solid rgba(200, 230, 180, 0.2);
		background: transparent;
		color: rgba(200, 230, 180, 0.5);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 20px;
	}

	.close-btn:hover {
		background: rgba(200, 230, 180, 0.1);
		color: rgba(200, 230, 180, 0.8);
		border-color: rgba(200, 230, 180, 0.3);
	}

	.modal-content {
		padding: 24px;
	}

	/* Confirmation screen */
	.confirmation-box {
		text-align: center;
		padding: 24px 16px;
		margin-bottom: 20px;
	}

	.confirmation-icon {
		font-size: 48px;
		display: block;
		margin-bottom: 16px;
	}

	.confirmation-title {
		font-size: 18px;
		color: rgba(200, 230, 180, 0.95);
		margin: 0 0 16px 0;
		font-weight: 500;
	}

	.confirmation-text {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.8);
		margin: 0 0 12px 0;
	}

	.confirmation-text strong {
		color: rgba(200, 230, 180, 1);
	}

	.confirmation-hint {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.5);
		margin: 0;
	}

	.terminal-prompt {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.prompt-symbol {
		color: rgba(200, 230, 180, 0.6);
	}

	.prompt-text {
		color: rgba(200, 230, 180, 0.9);
		font-size: 14px;
	}

	.cursor {
		width: 8px;
		height: 16px;
		background: rgba(200, 230, 180, 0.7);
		animation: blink 1s infinite;
	}

	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: rgba(255, 100, 100, 0.1);
		border: 1px solid rgba(255, 100, 100, 0.3);
		border-radius: 8px;
		margin-bottom: 16px;
		color: rgba(255, 150, 150, 0.9);
		font-size: 13px;
	}

	.error-icon {
		color: rgba(255, 150, 150, 0.8);
	}

	.success-message {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: rgba(100, 255, 100, 0.1);
		border: 1px solid rgba(100, 255, 100, 0.3);
		border-radius: 8px;
		margin-bottom: 16px;
		color: rgba(150, 255, 150, 0.9);
		font-size: 13px;
	}

	.success-icon {
		color: rgba(150, 255, 150, 0.8);
	}

	.form-field {
		margin-bottom: 16px;
	}

	.form-field label {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 8px;
	}

	.field-label {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.7);
		text-transform: lowercase;
	}

	.field-required {
		color: rgba(200, 230, 180, 0.5);
		font-size: 10px;
	}

	.field-optional {
		color: rgba(200, 230, 180, 0.4);
		font-size: 10px;
	}

	.field-hint {
		display: block;
		margin-top: 6px;
		font-size: 11px;
		color: rgba(200, 230, 180, 0.4);
	}

	.form-field input {
		width: 100%;
		padding: 14px 16px;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(120, 110, 130, 0.3);
		border-radius: 8px;
		color: rgba(200, 230, 180, 0.95);
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		transition: all 0.2s;
		box-sizing: border-box;
	}

	.form-field input::placeholder {
		color: rgba(200, 230, 180, 0.3);
	}

	.form-field input:focus {
		outline: none;
		border-color: rgba(200, 230, 180, 0.5);
		box-shadow: 0 0 0 3px rgba(200, 230, 180, 0.1);
	}

	.form-field input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-btn {
		width: 100%;
		padding: 14px 24px;
		background: linear-gradient(135deg, rgba(200, 230, 180, 0.2) 0%, rgba(200, 230, 180, 0.1) 100%);
		border: 1px solid rgba(200, 230, 180, 0.4);
		border-radius: 8px;
		color: rgba(200, 230, 180, 0.95);
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin-top: 8px;
	}

	.submit-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, rgba(200, 230, 180, 0.3) 0%, rgba(200, 230, 180, 0.15) 100%);
		border-color: rgba(200, 230, 180, 0.6);
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-icon {
		font-size: 16px;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(200, 230, 180, 0.3);
		border-top-color: rgba(200, 230, 180, 0.9);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.moon-reward {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		background: rgba(200, 230, 180, 0.05);
		border: 1px solid rgba(200, 230, 180, 0.15);
		border-radius: 8px;
		margin-top: 16px;
		font-size: 12px;
		color: rgba(200, 230, 180, 0.7);
	}

	.moon-reward strong {
		color: rgba(200, 230, 180, 0.95);
	}

	.moon-icon {
		font-size: 18px;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 16px 24px;
		background: rgba(0, 0, 0, 0.2);
		border-top: 1px solid rgba(120, 110, 130, 0.2);
	}

	.footer-text {
		font-size: 13px;
		color: rgba(200, 230, 180, 0.5);
	}

	.switch-btn {
		background: transparent;
		border: none;
		color: rgba(200, 230, 180, 0.9);
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
		transition: color 0.2s;
	}

	.switch-btn:hover {
		color: rgba(200, 230, 180, 1);
	}

	.switch-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
