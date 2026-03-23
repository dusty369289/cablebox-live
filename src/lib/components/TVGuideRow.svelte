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
		return `left: ${left}%; width: ${width}%;`;
	}

	function isCurrentSlot(slot: GuideSlot): boolean {
		return now >= slot.startTime && now < slot.endTime;
	}
</script>

<div class="guide-row" class:active={isActive}>
	<button class="channel-label" onclick={() => onTune(channel)}>
		<span class="channel-num">{channel.number}</span>
		<span class="channel-name">{channel.name}</span>
	</button>
	<div class="program-track">
		{#each slots as slot (slot.startTime)}
			<button
				class="program-block"
				class:now-playing={isCurrentSlot(slot)}
				style={getSlotStyle(slot)}
				onclick={() => onTune(channel)}
				title={slot.video.title}
			>
				<span class="program-title">{slot.video.title}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.guide-row {
		display: flex;
		height: 40px;
		border-bottom: 1px solid #1a3a1a;
	}

	.guide-row.active {
		background: rgba(51, 170, 51, 0.15);
	}

	.channel-label {
		flex-shrink: 0;
		width: 160px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		background: #0a1a0a;
		border: none;
		border-right: 2px solid #1a3a1a;
		color: #ccc;
		font-family: monospace;
		font-size: 0.8rem;
		cursor: pointer;
		text-align: left;
	}

	.channel-label:hover {
		background: #1a2a1a;
	}

	.channel-num {
		color: #3a3;
		font-weight: bold;
		min-width: 24px;
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
		background: #0d2a0d;
		border: 1px solid #1a3a1a;
		border-radius: 2px;
		color: #aaa;
		font-family: monospace;
		font-size: 0.7rem;
		padding: 0 6px;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: flex;
		align-items: center;
	}

	.program-block:hover {
		background: #1a3a1a;
		color: #fff;
	}

	.program-block.now-playing {
		background: #1a4a1a;
		border-color: #3a3;
		color: #fff;
	}

	.program-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
