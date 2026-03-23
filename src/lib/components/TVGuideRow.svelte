<script lang="ts">
	import type { Channel, GuideSlot } from '$lib/scheduling/types.js';

	type Props = {
		channel: Channel;
		slots: GuideSlot[];
		isActive: boolean;
		rangeStart: number;
		rangeDuration: number;
		now: number;
		onTune: (channel: Channel) => void;
	};

	let { channel, slots, isActive, rangeStart, rangeDuration, now, onTune }: Props = $props();

	function getSlotStyle(slot: GuideSlot): string {
		const left = ((slot.startTime - rangeStart) / rangeDuration) * 100;
		const width = ((slot.endTime - slot.startTime) / rangeDuration) * 100;
		return `left: calc(${left}% + 1px); width: calc(${width}% - 2px);`;
	}

	function isCurrentSlot(slot: GuideSlot): boolean {
		return now >= slot.startTime && now < slot.endTime;
	}

	let currentSlot = $derived(slots.find((s) => isCurrentSlot(s)));

	// Distinguish scroll from tap on touch devices
	let touchStartY = 0;
	let touchMoved = false;

	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
		touchMoved = false;
	}

	function handleTouchMove(e: TouchEvent) {
		if (Math.abs(e.touches[0].clientY - touchStartY) > 5) {
			touchMoved = true;
		}
	}

	function handleClick() {
		if (!touchMoved) {
			onTune(channel);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
	class="guide-row"
	class:active={isActive}
	onclick={handleClick}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && onTune(channel)}
>
	<div class="channel-label">
		<span class="channel-num">{channel.number}</span>
		<span class="channel-name">{channel.name}</span>
	</div>
	<div class="program-track">
		{#each slots as slot (slot.startTime)}
			<div
				class="program-block"
				class:now-playing={isCurrentSlot(slot)}
				style={getSlotStyle(slot)}
				title={slot.video.title}
			>
				<span class="program-title">{slot.video.title}</span>
			</div>
		{/each}
	</div>
	<div class="mobile-now-playing">
		{currentSlot?.video.title ?? ''}
	</div>
</div>

<style>
	.guide-row {
		display: flex;
		height: var(--guide-row-height);
		border: none;
		border-bottom: 1px solid var(--color-border);
		background: transparent;
		width: 100%;
		cursor: pointer;
		padding: 0;
		font-family: var(--font-family);
	}

	.guide-row:hover {
		background: var(--color-surface-hover);
	}

	.guide-row.active {
		background: var(--color-guide-active-row);
		border-left: 3px solid var(--color-primary);
	}

	.guide-row.active .channel-label {
		background: var(--color-surface-active);
		color: var(--color-text-bright);
	}

	.guide-row.active .channel-num {
		color: var(--color-primary-bright);
	}

	.guide-row.active .program-block {
		background: var(--color-guide-active-program);
		border-color: var(--color-guide-active-border);
		color: var(--color-text);
	}

	.guide-row.active .program-block.now-playing {
		background: var(--color-guide-now);
		border-color: var(--color-guide-now-border);
		color: var(--color-text-bright);
	}

	.channel-label {
		flex-shrink: 0;
		width: 160px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		background: var(--color-surface);
		border-right: 2px solid var(--color-border);
		color: var(--color-text);
		font-size: var(--guide-font-size);
		text-align: left;
	}

	.channel-num {
		color: var(--color-primary);
		font-weight: bold;
		min-width: 24px;
		text-shadow: var(--text-glow);
	}

	.channel-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.program-track {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.program-block {
		position: absolute;
		top: 2px;
		bottom: 2px;
		background: var(--color-guide-program);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius-sm);
		color: var(--color-text-dim);
		font-size: var(--guide-font-size-sm);
		padding: 0 6px;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: flex;
		align-items: center;
	}

	.program-block:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-bright);
	}

	.program-block.now-playing {
		background: var(--color-guide-now);
		border-color: var(--color-guide-now-border);
		color: var(--color-text-bright);
		text-shadow: var(--text-glow);
	}

	.program-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mobile-now-playing {
		display: none;
	}

	@media (max-width: 640px) {
		.guide-row {
			height: 52px;
		}

		.channel-label {
			width: 100px;
			font-size: 0.75rem;
		}

		.program-track {
			display: none;
		}

		.mobile-now-playing {
			display: flex;
			align-items: center;
			flex: 1;
			padding: 0 10px;
			color: var(--color-text-dim);
			font-size: var(--guide-font-size-sm);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
</style>
