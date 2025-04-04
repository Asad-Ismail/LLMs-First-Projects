import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		extensions: ['.js', '.ts', '.json']
	},
	build: {
		// Ensure TypeScript files are properly processed
		rollupOptions: {
			output: {
				// Ensures consistent file naming and makes them easier to find
				entryFileNames: 'assets/[name].[hash].js',
				chunkFileNames: 'assets/[name].[hash].js',
				assetFileNames: 'assets/[name].[hash].[ext]'
			}
		}
	}
});
