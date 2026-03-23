/**
 * Build script: fetches video data for curated channels using YouTube Data API v3.
 *
 * Paginates through each channel's uploads playlist, fetching durations as it
 * goes, until it accumulates at least TARGET_DURATION of content. Filters out
 * YouTube Shorts (videos under MIN_VIDEO_DURATION).
 *
 * Usage:
 *   npm run build:channels
 *
 * Requires YOUTUBE_API_KEY in .env file.
 * Outputs static/data/channels.json
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const TARGET_DURATION = 18 * 60 * 60; // 18 hours in seconds
const MIN_VIDEO_DURATION = 60; // Filter out Shorts (< 60s)
const MAX_PAGES = 20; // Safety cap: 20 pages × 50 = 1000 videos max

type ChannelDefinition = {
	name: string;
	slug: string;
	number: number;
	category: string;
	youtubeChannelId: string;
};

type VideoData = {
	id: string;
	title: string;
	duration: number;
	thumbnail: string;
};

type OutputChannel = {
	name: string;
	slug: string;
	number: number;
	category: string;
	sources: [{ type: 'default'; youtubeChannelId: string; videos: VideoData[] }];
};

// --- YouTube Data API helpers ---

async function apiFetch(endpoint: string, params: Record<string, string>, apiKey: string) {
	const url = new URL(`${API_BASE}/${endpoint}`);
	url.searchParams.set('key', apiKey);
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}

	const response = await fetch(url.toString());
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`YouTube API ${endpoint} error (${response.status}): ${text}`);
	}
	return response.json();
}

async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string> {
	const data = await apiFetch('channels', {
		part: 'contentDetails',
		id: channelId
	}, apiKey) as {
		items: Array<{
			contentDetails: {
				relatedPlaylists: { uploads: string };
			};
		}>;
	};

	if (!data.items || data.items.length === 0) {
		throw new Error(`Channel ${channelId} not found`);
	}
	return data.items[0].contentDetails.relatedPlaylists.uploads;
}

function parseISO8601Duration(iso: string): number {
	const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	const hours = parseInt(match[1] || '0', 10);
	const minutes = parseInt(match[2] || '0', 10);
	const seconds = parseInt(match[3] || '0', 10);
	return hours * 3600 + minutes * 60 + seconds;
}

async function fetchVideoDurations(
	videoIds: string[],
	apiKey: string
): Promise<Map<string, number>> {
	const durations = new Map<string, number>();

	for (let i = 0; i < videoIds.length; i += 50) {
		const batch = videoIds.slice(i, i + 50);
		const data = await apiFetch('videos', {
			part: 'contentDetails',
			id: batch.join(',')
		}, apiKey) as {
			items: Array<{ id: string; contentDetails: { duration: string } }>;
		};

		for (const item of data.items) {
			durations.set(item.id, parseISO8601Duration(item.contentDetails.duration));
		}
	}

	return durations;
}

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	return `${h}h${m}m`;
}

/**
 * Fetch videos from a channel until we have TARGET_DURATION of content.
 * Paginates through the uploads playlist, fetching durations per page,
 * and filtering out Shorts.
 */
async function fetchChannelVideos(
	channelId: string,
	apiKey: string
): Promise<VideoData[]> {
	const playlistId = await getUploadsPlaylistId(channelId, apiKey);
	const videos: VideoData[] = [];
	let totalDuration = 0;
	let pageToken: string | undefined;

	for (let page = 0; page < MAX_PAGES; page++) {
		// Fetch a page of playlist items
		const params: Record<string, string> = {
			part: 'snippet',
			playlistId,
			maxResults: '50'
		};
		if (pageToken) params.pageToken = pageToken;

		const data = await apiFetch('playlistItems', params, apiKey) as {
			items: Array<{
				snippet: {
					title: string;
					resourceId: { videoId: string };
				};
			}>;
			nextPageToken?: string;
		};

		if (!data.items || data.items.length === 0) break;

		const ids = data.items.map((item) => item.snippet.resourceId.videoId);

		// Fetch durations for this batch
		const durations = await fetchVideoDurations(ids, apiKey);

		// Add videos that pass the minimum duration filter
		for (const item of data.items) {
			const id = item.snippet.resourceId.videoId;
			const duration = durations.get(id);
			if (duration && duration >= MIN_VIDEO_DURATION) {
				videos.push({
					id,
					title: item.snippet.title,
					duration,
					thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`
				});
				totalDuration += duration;
			}
		}

		// Check if we have enough content
		if (totalDuration >= TARGET_DURATION) break;

		// Check for next page
		if (!data.nextPageToken) break;
		pageToken = data.nextPageToken;
	}

	return videos;
}

// --- Main ---

async function main() {
	const apiKey = process.env.YOUTUBE_API_KEY;
	if (!apiKey) {
		console.error('Error: YOUTUBE_API_KEY environment variable is required.');
		console.error('Create .env with YOUTUBE_API_KEY=your_key');
		console.error('Get a key at https://console.cloud.google.com/apis/credentials');
		process.exit(1);
	}

	const definitionsPath = resolve(__dirname, 'channel-definitions.json');
	const definitions: ChannelDefinition[] = JSON.parse(readFileSync(definitionsPath, 'utf-8'));

	console.log(`Target: ${formatDuration(TARGET_DURATION)} per channel, filtering <${MIN_VIDEO_DURATION}s\n`);
	console.log(`Processing ${definitions.length} channels...\n`);

	const output: OutputChannel[] = [];

	for (const def of definitions) {
		console.log(`  ${def.name} (${def.youtubeChannelId})`);
		try {
			const videos = await fetchChannelVideos(def.youtubeChannelId, apiKey);
			const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
			const met = totalDuration >= TARGET_DURATION;
			console.log(`    ${met ? '✓' : '⚠'} ${videos.length} videos, ${formatDuration(totalDuration)}${met ? '' : ' (under target)'}`);

			output.push({
				name: def.name,
				slug: def.slug,
				number: def.number,
				category: def.category,
				sources: [{
					type: 'default' as const,
					youtubeChannelId: def.youtubeChannelId,
					videos
				}]
			});
		} catch (err) {
			console.error(`    ✗ Failed: ${err}`);
			output.push({
				name: def.name,
				slug: def.slug,
				number: def.number,
				category: def.category,
				sources: [{
					type: 'default' as const,
					youtubeChannelId: def.youtubeChannelId,
					videos: []
				}]
			});
		}
	}

	// Write output
	const outputDir = resolve(__dirname, '..', 'static', 'data');
	mkdirSync(outputDir, { recursive: true });
	const outputPath = resolve(outputDir, 'channels.json');
	writeFileSync(outputPath, JSON.stringify(output, null, '\t'));

	const totalVideos = output.reduce((sum, ch) => sum + ch.sources[0].videos.length, 0);
	const totalDuration = output.reduce((sum, ch) =>
		sum + ch.sources[0].videos.reduce((s, v) => s + v.duration, 0), 0);
	console.log(`\nDone! ${output.length} channels, ${totalVideos} videos, ${formatDuration(totalDuration)} total`);
	console.log(`  → ${outputPath}`);
}

main().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
