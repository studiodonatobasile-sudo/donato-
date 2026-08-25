import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Pubblicata su GitHub Pages insieme ad altre app dello stesso sito, sotto
// /donato-/spese-familiari/. In sviluppo (`vite`) resta invece '/'.
const BASE_PATH = '/donato-/spese-familiari/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE_PATH : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Spese Familiari',
        short_name: 'Spese',
        description:
          'Monitora le spese quotidiane della famiglia con annotazione vocale, categorizzazione automatica e riepiloghi con grafici.',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        // Relativi alla posizione del manifest, cosi' funzionano sia in dev
        // sulla radice sia in produzione sotto /donato-/.
        start_url: '.',
        scope: '.',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}']
      }
    })
  ]
}))
