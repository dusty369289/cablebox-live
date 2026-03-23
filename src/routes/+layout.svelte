<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme } from '$lib/stores/settings.svelte.js';
	import '../styles/tokens.css';

	let { children } = $props();

	onMount(() => {
		applyTheme();
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

{@render children()}
