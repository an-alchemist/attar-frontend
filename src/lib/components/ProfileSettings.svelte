<script lang="ts">
	import { profile, updateProfile, uploadAvatar, signOut } from '$lib/stores/auth';

	type Props = {
		onClose: () => void;
	};

	let { onClose }: Props = $props();

	let pseudoname = $state($profile?.pseudoname || '');
	let receiveLetters = $state($profile?.receive_letters ?? true);
	let loading = $state(false);
	let uploadingAvatar = $state(false);
	let error = $state('');
	let success = $state('');

	let fileInput: HTMLInputElement;

	async function handleSave() {
		error = '';
		success = '';
		loading = true;

		try {
			await updateProfile({
				pseudoname: pseudoname.trim() || 'Anonymous',
				receive_letters: receiveLetters
			});
			success = 'Profile updated!';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to update profile';
		} finally {
			loading = false;
		}
	}

	async function handleAvatarChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Validate file
		if (!file.type.startsWith('image/')) {
			error = 'Please select an image file';
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			error = 'Image must be less than 2MB';
			return;
		}

		error = '';
		uploadingAvatar = true;

		try {
			await uploadAvatar(file);
			success = 'Avatar updated!';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to upload avatar';
		} finally {
			uploadingAvatar = false;
		}
	}

	function triggerFileSelect() {
		fileInput?.click();
	}

	async function handleSignOut() {
		await signOut();
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div 
	class="settings-overlay"
	onclick={onClose}
	onkeydown={handleKeydown}
	role="dialog"
	tabindex="-1"
>
	<div 
		class="settings-modal"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="document"
	>
		<!-- Header -->
		<div class="modal-header">
			<div class="header-left">
				<span class="header-icon">⚙</span>
				<span class="header-title">Settings</span>
			</div>
			<button class="close-btn" onclick={onClose}>
				<span>×</span>
			</button>
		</div>

		<!-- Content -->
		<div class="modal-content">
			<!-- Avatar Section -->
			<div class="avatar-section">
				<div class="avatar-preview" onclick={triggerFileSelect}>
					{#if uploadingAvatar}
						<div class="avatar-loading">
							<span class="loading-spinner"></span>
						</div>
					{:else if $profile?.avatar_url}
						<img src={$profile.avatar_url} alt="Avatar" />
						<div class="avatar-overlay">
							<span>Change</span>
						</div>
					{:else}
						<span class="avatar-placeholder">◆</span>
						<div class="avatar-overlay">
							<span>Upload</span>
						</div>
					{/if}
				</div>
				<input 
					type="file" 
					accept="image/*" 
					bind:this={fileInput}
					onchange={handleAvatarChange}
					class="hidden-input"
				/>
				<div class="avatar-info">
					<span class="avatar-label">Profile Picture</span>
					<span class="avatar-hint">Click to change • Max 2MB</span>
				</div>
			</div>

			<!-- Moon Balance -->
			<div class="moon-section">
				<div class="moon-display">
					<span class="moon-icon">🌙</span>
					<span class="moon-count">{$profile?.available_moons || 0}</span>
				</div>
				<div class="moon-info">
					<span class="moon-label">Moons Available Today</span>
					<span class="moon-hint">Refreshes daily at midnight UTC</span>
				</div>
			</div>

			<!-- Divider -->
			<div class="section-divider"></div>

			<!-- Messages -->
			{#if error}
				<div class="message error-message">
					<span class="message-icon">⚠</span>
					<span>{error}</span>
				</div>
			{/if}

			{#if success}
				<div class="message success-message">
					<span class="message-icon">✓</span>
					<span>{success}</span>
				</div>
			{/if}

			<!-- Form -->
			<div class="form-field">
				<label for="pseudoname">
					<span class="field-label">Pseudoname</span>
				</label>
				<input
					type="text"
					id="pseudoname"
					bind:value={pseudoname}
					placeholder="Anonymous"
					maxlength="50"
				/>
				<span class="field-hint">How others will see you</span>
			</div>

			<div class="form-field checkbox-field">
				<label class="checkbox-label">
					<input
						type="checkbox"
						bind:checked={receiveLetters}
					/>
					<span class="checkbox-custom"></span>
					<span class="checkbox-text">Receive letters from Attar</span>
				</label>
				<span class="field-hint">Get notified when Attar writes to you</span>
			</div>

			<!-- Save Button -->
			<button 
				class="save-btn" 
				onclick={handleSave}
				disabled={loading}
			>
				{#if loading}
					<span class="loading-spinner small"></span>
					<span>Saving...</span>
				{:else}
					<span>Save Changes</span>
				{/if}
			</button>
		</div>

		<!-- Footer -->
		<div class="modal-footer">
			<button class="signout-btn" onclick={handleSignOut}>
				<span class="signout-icon">↪</span>
				<span>Sign Out</span>
			</button>
		</div>
	</div>
</div>

<style>
	.settings-overlay {
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

	.settings-modal {
		background: linear-gradient(145deg, rgba(35, 30, 45, 0.98) 0%, rgba(20, 18, 28, 1) 100%);
		border: 1px solid rgba(120, 110, 130, 0.5);
		border-radius: 16px;
		width: 90vw;
		max-width: 440px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
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
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.header-icon {
		font-size: 18px;
		color: rgba(200, 230, 180, 0.8);
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
		overflow-y: auto;
		flex: 1;
	}

	/* Avatar Section */
	.avatar-section {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 20px;
	}

	.avatar-preview {
		width: 72px;
		height: 72px;
		border-radius: 12px;
		overflow: hidden;
		border: 2px solid rgba(200, 230, 180, 0.3);
		cursor: pointer;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(200, 230, 180, 0.1);
		transition: all 0.2s;
	}

	.avatar-preview:hover {
		border-color: rgba(200, 230, 180, 0.5);
	}

	.avatar-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		font-size: 28px;
		color: rgba(200, 230, 180, 0.5);
	}

	.avatar-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s;
		font-size: 11px;
		color: rgba(200, 230, 180, 0.9);
	}

	.avatar-preview:hover .avatar-overlay {
		opacity: 1;
	}

	.avatar-loading {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hidden-input {
		display: none;
	}

	.avatar-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.avatar-label {
		font-size: 14px;
		color: rgba(200, 230, 180, 0.9);
	}

	.avatar-hint {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.4);
	}

	/* Moon Section */
	.moon-section {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		background: rgba(200, 230, 180, 0.05);
		border: 1px solid rgba(200, 230, 180, 0.15);
		border-radius: 12px;
		margin-bottom: 20px;
	}

	.moon-display {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
	}

	.moon-icon {
		font-size: 20px;
	}

	.moon-count {
		font-size: 24px;
		font-weight: 500;
		color: rgba(200, 230, 180, 0.95);
	}

	.moon-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.moon-label {
		font-size: 13px;
		color: rgba(200, 230, 180, 0.8);
	}

	.moon-hint {
		font-size: 11px;
		color: rgba(200, 230, 180, 0.4);
	}

	.section-divider {
		height: 1px;
		background: rgba(120, 110, 130, 0.3);
		margin: 20px 0;
	}

	/* Messages */
	.message {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 16px;
		font-size: 13px;
	}

	.error-message {
		background: rgba(255, 100, 100, 0.1);
		border: 1px solid rgba(255, 100, 100, 0.3);
		color: rgba(255, 150, 150, 0.9);
	}

	.success-message {
		background: rgba(100, 255, 150, 0.1);
		border: 1px solid rgba(100, 255, 150, 0.3);
		color: rgba(150, 255, 180, 0.9);
	}

	/* Form Fields */
	.form-field {
		margin-bottom: 20px;
	}

	.form-field label {
		display: block;
		margin-bottom: 8px;
	}

	.field-label {
		font-size: 12px;
		color: rgba(200, 230, 180, 0.7);
		text-transform: lowercase;
	}

	.form-field input[type="text"] {
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

	.form-field input[type="text"]::placeholder {
		color: rgba(200, 230, 180, 0.3);
	}

	.form-field input[type="text"]:focus {
		outline: none;
		border-color: rgba(200, 230, 180, 0.5);
		box-shadow: 0 0 0 3px rgba(200, 230, 180, 0.1);
	}

	.field-hint {
		display: block;
		margin-top: 6px;
		font-size: 11px;
		color: rgba(200, 230, 180, 0.4);
	}

	/* Checkbox */
	.checkbox-field {
		margin-bottom: 24px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		display: none;
	}

	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 1px solid rgba(200, 230, 180, 0.3);
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.3);
		position: relative;
		transition: all 0.2s;
	}

	.checkbox-label input:checked + .checkbox-custom {
		background: rgba(200, 230, 180, 0.2);
		border-color: rgba(200, 230, 180, 0.5);
	}

	.checkbox-label input:checked + .checkbox-custom::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 12px;
		color: rgba(200, 230, 180, 0.9);
	}

	.checkbox-text {
		font-size: 13px;
		color: rgba(200, 230, 180, 0.8);
	}

	/* Save Button */
	.save-btn {
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
	}

	.save-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, rgba(200, 230, 180, 0.3) 0%, rgba(200, 230, 180, 0.15) 100%);
		border-color: rgba(200, 230, 180, 0.6);
	}

	.save-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Loading Spinner */
	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(200, 230, 180, 0.3);
		border-top-color: rgba(200, 230, 180, 0.9);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-spinner.small {
		width: 16px;
		height: 16px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Footer */
	.modal-footer {
		padding: 16px 24px;
		background: rgba(0, 0, 0, 0.2);
		border-top: 1px solid rgba(120, 110, 130, 0.2);
		flex-shrink: 0;
	}

	.signout-btn {
		width: 100%;
		padding: 12px;
		background: transparent;
		border: 1px solid rgba(255, 100, 100, 0.3);
		border-radius: 8px;
		color: rgba(255, 150, 150, 0.8);
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.signout-btn:hover {
		background: rgba(255, 100, 100, 0.1);
		border-color: rgba(255, 100, 100, 0.5);
		color: rgba(255, 150, 150, 1);
	}

	.signout-icon {
		font-size: 14px;
	}
</style>

