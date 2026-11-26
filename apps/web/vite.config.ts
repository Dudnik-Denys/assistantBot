import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
			},
			adapter: adapter(),
			// Общий .env лежит в корне монорепо. e2e задают каталог без .env (TGAB_ENV_DIR) и
			// передают переменные сами — тесты не читают рабочие секреты.
			env: { dir: process.env.TGAB_ENV_DIR ?? '../..' },
		}),
	],
	server: {
		// Mini App в разработке открывается через HTTPS-туннель (cloudflared / ngrok).
		allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app'],
	},
});
