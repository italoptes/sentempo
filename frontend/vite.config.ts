import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['images/icone_sentempo.png'],
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Coleta exige confirmação online. Nunca enfileirar salvamentos para replay.
        runtimeCaching: []
      },
      manifest: {
        name: 'SenTempo',
        short_name: 'SenTempo',
        description: 'Estudo de percepção temporal',
        theme_color: '#0F2D2E',
        background_color: '#F7F8F7',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/images/icone_sentempo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/images/icone_sentempo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
