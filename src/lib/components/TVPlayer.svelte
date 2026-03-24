<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createPlayer } from '$lib/youtube/player.js';
	import { PlayerState } from '$lib/youtube/types.js';
	import type { YTPlayer } from '$lib/youtube/types.js';
	import { getVolume, isMuted as getIsMuted } from '$lib/stores/settings.svelte.js';

	type Props = {
		videoId: string;
		startSeconds: number;
		onVideoEnd?: () => void;
	};

	let { videoId, startSeconds, onVideoEnd }: Props = $props();

	let player: YTPlayer | null = null;
	let ready = $state(false);
	let currentVideoId = '';
	let settingsApplied = false;
	let errorMessage = $state('');
	let adPlaying = $state(false);
	let adCheckInterval: ReturnType<typeof setInterval> | null = null;
	let containerEl: HTMLDivElement | undefined = $state();

	const ERROR_MESSAGES: Record<number, string> = {
		2: 'Invalid video parameter',
		5: 'Player error',
		100: 'Video not found or removed',
		101: 'Video cannot be embedded',
		150: 'Video restricted'
	};

	function checkForAd() {
		if (!player || !currentVideoId) return;
		try {
			const url = player.getVideoUrl();
			const isAd = !!url && !url.includes(currentVideoId);
			if (isAd !== adPlaying) {
				const wasAd = adPlaying;
				adPlaying = isAd;
				updatePointerEvents();
				// Ad just ended — resync playhead to live schedule
				if (wasAd && !isAd) {
					onVideoEnd?.();
				}
			}
		} catch {}
	}

	function updatePointerEvents() {
		const iframe = containerEl?.querySelector('iframe');
		if (iframe) {
			iframe.style.pointerEvents = adPlaying ? 'auto' : 'none';
		}
	}

	onMount(async () => {
		player = await createPlayer('yt-player', {
			onReady: () => {
				ready = true;
				if (videoId) {
					loadVideo(videoId, startSeconds);
				}
			},
			onStateChange: (state) => {
				if (state === PlayerState.PLAYING && player && !settingsApplied) {
					settingsApplied = true;
					player.setVolume(getVolume());
					if (getIsMuted()) player.mute();
				}
				if (state === PlayerState.PLAYING) {
					errorMessage = '';
				}
				checkForAd();
				// Only auto-resume if paused AND not in an ad
				if (state === PlayerState.PAUSED && player && !adPlaying) {
					player.playVideo();
				}
			},
			onVideoEnd: () => {
				onVideoEnd?.();
			},
			onError: (code) => {
				console.warn(`YouTube player error ${code}: ${ERROR_MESSAGES[code] || 'Unknown'}`);
				errorMessage = ERROR_MESSAGES[code] || `Error ${code}`;
				setTimeout(() => onVideoEnd?.(), 3000);
			}
		});

		adCheckInterval = setInterval(checkForAd, 1000);
	});

	onDestroy(() => {
		player?.destroy();
		if (adCheckInterval) clearInterval(adCheckInterval);
	});

	function loadVideo(id: string, offset: number) {
		if (!player || !ready) return;
		currentVideoId = id;
		errorMessage = '';
		adPlaying = false;
		updatePointerEvents();
		player.loadVideoById({ videoId: id, startSeconds: offset });
	}

	$effect(() => {
		if (ready && videoId && videoId !== currentVideoId) {
			loadVideo(videoId, startSeconds);
		}
	});

	export function setVolume(vol: number) {
		player?.setVolume(vol);
	}

	export function mute() {
		player?.mute();
	}

	export function unmute() {
		player?.unMute();
	}

	export function isMuted(): boolean {
		return player?.isMuted() ?? false;
	}
</script>

<div class="tv-player" bind:this={containerEl}>
	<div id="yt-player"></div>
	{#if errorMessage}
		<div class="error-overlay">
			<div class="error-text">{errorMessage}</div>
			<div class="error-sub">Skipping to next video...</div>
		</div>
	{/if}
</div>

<style>
	.tv-player {
		width: 100%;
		height: 100%;
		background: #000;
		position: relative;
		overflow: hidden;
	}

	.tv-player :global(iframe) {
		width: 100%;
		height: 100%;
		border: none;
		pointer-events: none;
	}

	.error-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.85);
		z-index: 2;
		font-family: monospace;
	}

	.error-text {
		color: #f66;
		font-size: 1.2rem;
		margin-bottom: 8px;
	}

	.error-sub {
		color: #666;
		font-size: 0.9rem;
	}
</style>
