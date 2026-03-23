import type { YTPlayer, YTPlayerOptions, YTPlayerEvent } from './types.js';
import { PlayerState } from './types.js';

let apiLoaded = false;
let apiLoading = false;
let apiReadyResolve: (() => void) | null = null;
const apiReadyPromise = new Promise<void>((resolve) => {
	apiReadyResolve = resolve;
});

/**
 * Load the YouTube IFrame Player API script.
 * Safe to call multiple times — only loads once.
 */
export function loadYouTubeAPI(): Promise<void> {
	if (apiLoaded) return Promise.resolve();
	if (apiLoading) return apiReadyPromise;

	apiLoading = true;

	// YouTube calls this global when the API is ready
	window.onYouTubeIframeAPIReady = () => {
		apiLoaded = true;
		apiReadyResolve?.();
	};

	const script = document.createElement('script');
	script.src = 'https://www.youtube.com/iframe_api';
	script.async = true;
	document.head.appendChild(script);

	return apiReadyPromise;
}

export type PlayerCallbacks = {
	onReady?: () => void;
	onStateChange?: (state: number) => void;
	onError?: (errorCode: number) => void;
	onVideoEnd?: () => void;
};

/**
 * Create a YouTube player instance inside the given element.
 */
export async function createPlayer(
	elementId: string,
	callbacks: PlayerCallbacks = {}
): Promise<YTPlayer> {
	await loadYouTubeAPI();

	return new Promise<YTPlayer>((resolve) => {
		const options: YTPlayerOptions = {
			width: '100%',
			height: '100%',
			playerVars: {
				autoplay: 1,
				controls: 0,
				disablekb: 1,
				rel: 0,
				enablejsapi: 1,
				iv_load_policy: 3
			},
			events: {
				onReady: (event: YTPlayerEvent) => {
					callbacks.onReady?.();
					resolve(event.target);
				},
				onStateChange: (event: YTPlayerEvent) => {
					callbacks.onStateChange?.(event.data);
					if (event.data === PlayerState.ENDED) {
						callbacks.onVideoEnd?.();
					}
				},
				onError: (event: YTPlayerEvent) => {
					callbacks.onError?.(event.data);
				}
			}
		};

		new window.YT.Player(elementId, options);
	});
}
