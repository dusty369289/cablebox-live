/** YouTube IFrame Player API types. */

export const enum PlayerState {
	UNSTARTED = -1,
	ENDED = 0,
	PLAYING = 1,
	PAUSED = 2,
	BUFFERING = 3,
	CUED = 5
}

export type YTPlayerEvent = {
	target: YTPlayer;
	data: number;
};

export type YTPlayer = {
	loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
	playVideo(): void;
	pauseVideo(): void;
	stopVideo(): void;
	seekTo(seconds: number, allowSeekAhead: boolean): void;
	setVolume(volume: number): void;
	getVolume(): number;
	mute(): void;
	unMute(): void;
	isMuted(): boolean;
	getPlayerState(): number;
	getDuration(): number;
	getCurrentTime(): number;
	destroy(): void;
};

export type YTPlayerOptions = {
	videoId?: string;
	width?: number | string;
	height?: number | string;
	playerVars?: {
		autoplay?: 0 | 1;
		controls?: 0 | 1;
		disablekb?: 0 | 1;
		modestbranding?: 0 | 1;
		rel?: 0 | 1;
		start?: number;
		enablejsapi?: 0 | 1;
		origin?: string;
		iv_load_policy?: 1 | 3;
	};
	events?: {
		onReady?: (event: YTPlayerEvent) => void;
		onStateChange?: (event: YTPlayerEvent) => void;
		onError?: (event: YTPlayerEvent) => void;
	};
};

declare global {
	interface Window {
		YT: {
			Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
			PlayerState: typeof PlayerState;
		};
		onYouTubeIframeAPIReady: (() => void) | undefined;
	}
}
