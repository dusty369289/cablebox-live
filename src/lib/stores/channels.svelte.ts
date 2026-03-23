/**
 * Channel store: manages the channel lineup and current selection.
 */
import type { Channel } from '$lib/scheduling/types.js';

let channels = $state<Channel[]>([]);
let currentIndex = $state(0);

export function setChannels(list: Channel[]) {
	channels = list;
	currentIndex = 0;
}

export function getChannels(): Channel[] {
	return channels;
}

export function getCurrentChannel(): Channel | null {
	return channels[currentIndex] ?? null;
}

export function getCurrentIndex(): number {
	return currentIndex;
}

export function switchToChannel(index: number) {
	if (index >= 0 && index < channels.length) {
		currentIndex = index;
	}
}

export function switchToChannelByNumber(num: number) {
	const idx = channels.findIndex((ch) => ch.number === num);
	if (idx >= 0) {
		currentIndex = idx;
	}
}

export function channelUp() {
	if (channels.length === 0) return;
	currentIndex = (currentIndex + 1) % channels.length;
}

export function channelDown() {
	if (channels.length === 0) return;
	currentIndex = (currentIndex - 1 + channels.length) % channels.length;
}
