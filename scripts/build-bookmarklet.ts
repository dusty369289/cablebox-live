/**
 * Builds the bookmarklet scraper.ts into a minified standalone JS file
 * and a bookmarklet: URL that loads it.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(__dirname, '..', 'src', 'lib', 'bookmarklet', 'scraper.ts');
const outDir = resolve(__dirname, '..', 'static');

let commitHash = 'dev';
try { commitHash = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}

// Optional: set BOOKMARKLET_VERSION_URL env var to enable update checking
const versionUrl = process.env.BOOKMARKLET_VERSION_URL || '';

async function main() {
	// Bundle and minify the scraper
	const result = await build({
		entryPoints: [srcPath],
		bundle: true,
		minify: true,
		write: false,
		format: 'iife',
		target: 'es2020',
		define: {
			'__BOOKMARKLET_VERSION__': JSON.stringify(commitHash),
			'__BOOKMARKLET_VERSION_URL__': JSON.stringify(versionUrl),
		},
	});

	const code = result.outputFiles[0].text;

	// Write the full script
	writeFileSync(resolve(outDir, 'bookmarklet.js'), code);
	console.log(`Built bookmarklet.js (${(code.length / 1024).toFixed(1)}KB)`);

	// Generate the bookmarklet URL (loads the script from the app's domain)
	// For development, we inline it. For production, it would load from the hosted URL.
	const bookmarkletUrl = `javascript:void(${encodeURIComponent(`(function(){${code}})()`)})`
	writeFileSync(resolve(outDir, 'bookmarklet-url.txt'), bookmarkletUrl);
	console.log(`Built bookmarklet-url.txt (${(bookmarkletUrl.length / 1024).toFixed(1)}KB)`);
}

main().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
