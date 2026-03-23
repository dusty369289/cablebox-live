import { base } from '$app/paths';
import type { Channel } from '$lib/scheduling/types.js';

const GIST_URL = 'https://gist.githubusercontent.com/dusty369289/5ec22d2a61f18d920b9c8c4d19a31303/raw/channels.json';

/**
 * Load default channel data. Tries the live gist first (updated daily),
 * falls back to the static bundled copy if the gist is unavailable.
 */
export async function loadDefaultChannels(): Promise<Channel[]> {
	// Try live gist first (cache-bust to avoid stale CDN cache)
	try {
		const res = await fetch(`${GIST_URL}?_=${Date.now()}`, { cache: 'no-store' });
		if (res.ok) {
			const data = await res.json();
			if (Array.isArray(data) && data.length > 0) {
				console.log(`Loaded ${data.length} channels from live gist`);
				return data;
			}
		}
	} catch {
		// Gist unavailable, fall through to static
	}

	// Fallback to static bundled copy
	console.log('Using bundled channel data');
	const response = await fetch(`${base}/data/channels.json`);
	if (!response.ok) {
		throw new Error(`Failed to load channels: ${response.status}`);
	}
	return response.json();
}
