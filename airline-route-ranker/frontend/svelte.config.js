import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Configure for a static site with SPA fallback
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',  // Important for SPA routing
			precompress: false,
			strict: false
		}),
		
		// Ensure paths are relative to the base URL
		paths: {
			base: '',
			assets: ''
		},
		
		// Important: No server-side rendering, use client-side SPA mode
		prerender: {
			default: false,
			entries: []
		}
	}
};

export default config;
