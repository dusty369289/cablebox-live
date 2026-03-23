<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import TVPlayer from '$lib/components/TVPlayer.svelte';
	import TVGuide from '$lib/components/TVGuide.svelte';
	import ChannelBanner from '$lib/components/ChannelBanner.svelte';
	import { loadDefaultChannels } from '$lib/data/loader.js';
	import { getScheduleAt } from '$lib/scheduling/scheduler.js';
	import {
		setChannels,
		getCurrentChannel,
		getCurrentIndex,
		channelUp,
		channelDown,
		switchToChannel,
		switchToChannelByNumber,
		getChannels
	} from '$lib/stores/channels.svelte.js';
	import { startClock, stopClock, getCurrentTime } from '$lib/stores/clock.svelte.js';
	import type { Channel, ScheduleResult } from '$lib/scheduling/types.js';

	let loaded = $state(false);
	let schedule = $state<ScheduleResult | null>(null);
	let showGuide = $state(false);
	let tickInterval: ReturnType<typeof setInterval> | null = null;

	// Number input buffer for direct channel entry
	let numberBuffer = '';
	let numberTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		const channels = await loadDefaultChannels();
		setChannels(channels);
		startClock();
		loaded = true;

		// Update schedule every second
		tickInterval = setInterval(updateSchedule, 1000);
		updateSchedule();
	});

	onDestroy(() => {
		stopClock();
		if (tickInterval) clearInterval(tickInterval);
	});

	function updateSchedule() {
		const channel = getCurrentChannel();
		if (!channel) return;
		const now = getCurrentTime();
		schedule = getScheduleAt(channel, now);
	}

	function handleVideoEnd() {
		updateSchedule();
	}

	function handleTune(channel: Channel) {
		const channels = getChannels();
		const idx = channels.findIndex((ch) => ch.slug === channel.slug);
		if (idx >= 0) {
			switchToChannel(idx);
			updateSchedule();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		switch (event.key) {
			case 'ArrowUp':
			case '+':
				event.preventDefault();
				channelUp();
				updateSchedule();
				break;
			case 'ArrowDown':
			case '-':
				event.preventDefault();
				channelDown();
				updateSchedule();
				break;
			case 'g':
			case 'G':
				event.preventDefault();
				showGuide = !showGuide;
				break;
			case 'Escape':
				event.preventDefault();
				if (showGuide) showGuide = false;
				break;
			default:
				if (event.key >= '0' && event.key <= '9') {
					event.preventDefault();
					numberBuffer += event.key;
					if (numberTimeout) clearTimeout(numberTimeout);
					numberTimeout = setTimeout(() => {
						const num = parseInt(numberBuffer, 10);
						switchToChannelByNumber(num);
						updateSchedule();
						numberBuffer = '';
					}, 800);
				}
		}
	}

	let currentChannel = $derived(getCurrentChannel());
	let currentIndex = $derived(getCurrentIndex());
	let allChannels = $derived(getChannels());
	let now = $derived(getCurrentTime());
	let videoId = $derived(schedule?.video.id ?? '');
	let startSeconds = $derived(schedule?.offsetSeconds ?? 0);
	let videoTitle = $derived(schedule?.video.title ?? '');
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Channel Surfer</title>
</svelte:head>

{#if !loaded}
	<div class="loading">
		<p>Loading channels...</p>
	</div>
{:else}
	<div class="tv-container">
		<TVPlayer {videoId} {startSeconds} onVideoEnd={handleVideoEnd} />
		<ChannelBanner channel={currentChannel} {videoTitle} />

		<div class="channel-indicator">
			{#if currentChannel}
				CH {currentChannel.number}
			{/if}
		</div>

		<button class="guide-toggle" onclick={() => (showGuide = !showGuide)}>
			{showGuide ? 'Hide Guide' : 'Guide (G)'}
		</button>

		{#if showGuide}
			<TVGuide
				channels={allChannels}
				currentChannelIndex={currentIndex}
				{now}
				onTune={handleTune}
			/>
		{/if}
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #000;
		overflow: hidden;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		color: #3a3;
		font-family: monospace;
		font-size: 1.5rem;
		background: #000;
	}

	.tv-container {
		position: relative;
		width: 100vw;
		height: 100vh;
	}

	.channel-indicator {
		position: absolute;
		top: 20px;
		right: 20px;
		font-family: monospace;
		font-size: 1.2rem;
		color: #3a3;
		background: rgba(0, 0, 0, 0.6);
		padding: 4px 12px;
		z-index: 10;
	}

	.guide-toggle {
		position: absolute;
		bottom: 20px;
		right: 20px;
		background: rgba(0, 0, 0, 0.7);
		border: 1px solid #3a3;
		color: #3a3;
		font-family: monospace;
		font-size: 0.8rem;
		padding: 6px 14px;
		cursor: pointer;
		z-index: 25;
		border-radius: 4px;
	}

	.guide-toggle:hover {
		background: rgba(51, 170, 51, 0.2);
	}
</style>
