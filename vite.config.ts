import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// Base path configurable pour GitHub Pages (servi sous /<repo>/).
// En local : '/'. En CI Pages : BASE_PATH=/<repo>/ (cf. .github/workflows/deploy.yml).
const base = process.env.BASE_PATH ?? '/';

// Version injectée au build (déterministe, pas d'horloge runtime — Principe I) pour le pied de page.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['404.html', 'favicon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Générateur de Pouvoir',
        short_name: 'GénPouvoir',
        description: 'Générateur de pouvoirs déterministe (hors-ligne).',
        theme_color: '#1f2933',
        background_color: '#1f2933',
        display: 'standalone',
        // start_url/scope relatifs pour rester compatibles avec le base path Pages.
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Precache de tous les assets du bundle → fonctionnement hors-ligne (Principe III).
        // woff2 inclus : polices auto-hébergées disponibles hors-ligne dès le 1er rendu (FR-020).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
      },
    }),
  ],
});
