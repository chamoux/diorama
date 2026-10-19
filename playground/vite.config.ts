import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    laravel({ input: ['resources/js/app.ts'], ssr: 'resources/js/ssr.ts', refresh: true }),
    vue(),
  ],
  resolve: {
    // Consume the library SOURCE for instant HMR while developing. DIORAMA_DIST=1 builds
    // against the published dist/ instead, to verify what actually ships to npm.
    alias: process.env.DIORAMA_DIST
      ? {}
      : { '@chamoux/diorama': resolve(import.meta.dirname, '../packages/diorama/src/index.ts') },
  },
})
