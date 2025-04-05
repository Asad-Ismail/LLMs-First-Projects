import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Log the environment variables to help debug
console.log('Build Environment Variables:', {
	PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL,
	NODE_ENV: process.env.NODE_ENV
});

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		extensions: ['.js', '.ts', '.json']
	},
	// Define fallback values for environment variables to ensure they're available
	define: {
		'import.meta.env.PUBLIC_API_BASE_URL': 
			JSON.stringify(process.env.PUBLIC_API_BASE_URL || 'https://airline-route-reliability.onrender.com')
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
