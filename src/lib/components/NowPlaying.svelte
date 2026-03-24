<script lang="ts">
	import type { Channel, ScheduleResult } from '$lib/scheduling/types.js';

	type Props = {
		channel: Channel | null;
		schedule: ScheduleResult | null;
	};

	let { channel, schedule }: Props = $props();

	function formatTimeRemaining(seconds: number): string {
		if (seconds <= 0) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	let progress = $derived(
		schedule ? (schedule.offsetSeconds / schedule.video.duration) * 100 : 0
	);

	const UP_NEXT_THRESHOLD = 300; // Show "up next" when under 5 minutes left
	let showUpNext = $derived(
		schedule ? schedule.secondsUntilNext <= UP_NEXT_THRESHOLD && schedule.nextVideo.id !== schedule.video.id : false
	);
</script>

{#if channel && schedule}
	<div class="now-playing">
		<div class="np-channel">
			<span class="np-number">CH {channel.number}</span>
			<span class="np-name">{channel.name}</span>
			{#if schedule.video.creator}
				<span class="np-creator">{schedule.video.creator}</span>
			{/if}
		</div>
		<div class="np-video">
			<span class="np-title">{schedule.video.title}</span>
			<span class="np-time">{formatTimeRemaining(schedule.secondsUntilNext)} left</span>
		</div>
		<div class="np-progress">
			<div class="np-progress-fill" style="width: {progress}%"></div>
		</div>
		{#if showUpNext}
			<div class="np-up-next">
				<span class="np-up-next-label">Up next</span>
				<span class="np-up-next-title">{schedule.nextVideo.title}</span>
				{#if schedule.nextVideo.creator}
					<span class="np-up-next-creator">· {schedule.nextVideo.creator}</span>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.now-playing {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to bottom, var(--color-overlay-bg) 60%, transparent);
		padding: 12px 16px 32px;
		z-index: 8;
		font-family: var(--font-family);
		pointer-events: none;
	}

	.np-channel {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.np-number {
		color: var(--color-primary);
		font-weight: bold;
		font-size: 0.8rem;
		text-shadow: var(--text-glow);
	}

	.np-name {
		color: var(--color-text-dim);
		font-size: 0.75rem;
	}

	.np-creator {
		color: var(--color-text-dim);
		font-size: 0.75rem;
		opacity: 0.7;
	}

	.np-creator::before {
		content: '·';
		margin-right: 8px;
	}

	.np-video {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.np-title {
		color: var(--color-text-bright);
		font-size: 0.85rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.np-time {
		color: var(--color-text-dim);
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.np-progress {
		margin-top: 6px;
		height: 2px;
		background: var(--color-border);
		border-radius: 1px;
		overflow: hidden;
	}

	.np-progress-fill {
		height: 100%;
		background: var(--color-primary);
		transition: width 1s linear;
	}

	.np-up-next {
		margin-top: 6px;
		display: flex;
		align-items: center;
		gap: 6px;
		animation: fade-in 0.5s ease-out;
	}

	.np-up-next-label {
		color: var(--color-primary);
		font-size: 0.7rem;
		font-weight: bold;
		text-transform: uppercase;
		opacity: 0.8;
	}

	.np-up-next-title {
		color: var(--color-text-dim);
		font-size: 0.75rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.np-up-next-creator {
		color: var(--color-text-dim);
		font-size: 0.7rem;
		opacity: 0.6;
		white-space: nowrap;
	}

	@keyframes fade-in {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@media (max-width: 640px) {
		.now-playing {
			padding: 8px 12px 16px;
		}
		.np-title { font-size: 0.8rem; }
	}
</style>
