/**
 * Reactive clock that ticks every second.
 * Provides the current unix timestamp in seconds for schedule computation.
 */

let now = $state(Math.floor(Date.now() / 1000));
let interval: ReturnType<typeof setInterval> | null = null;

export function startClock() {
	if (interval) return;
	now = Math.floor(Date.now() / 1000);
	interval = setInterval(() => {
		now = Math.floor(Date.now() / 1000);
	}, 1000);
}

export function stopClock() {
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
}

export function getCurrentTime(): number {
	return now;
}
