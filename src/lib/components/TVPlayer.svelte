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

	onMount(async () => {
		player = await createPlayer('yt-player', {
			onReady: () => {
				ready = true;
				// Apply persisted volume/mute settings
				player!.setVolume(getVolume());
				if (getIsMuted()) player!.mute();
				if (videoId) {
					loadVideo(videoId, startSeconds);
				}
			},
			onStateChange: (state) => {
				// Auto-resume if paused — no pause allowed, enforces live schedule
				if (state === PlayerState.PAUSED && player) {
					player.playVideo();
				}
			},
			onVideoEnd: () => {
				onVideoEnd?.();
			},
			onError: (code) => {
				console.warn(`YouTube player error: ${code}`);
				onVideoEnd?.();
			}
		});
	});

	onDestroy(() => {
		player?.destroy();
	});

	function loadVideo(id: string, offset: number) {
		if (!player || !ready) return;
		currentVideoId = id;
		player.loadVideoById({ videoId: id, startSeconds: offset });
	}

	// React to prop changes
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

<div class="tv-player">
	<div id="yt-player"></div>
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
</style>
