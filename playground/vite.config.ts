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
    alias: {
      // Consume the library SOURCE for instant HMR while developing.
      '@chamoux/diorama': resolve(import.meta.dirname, '../packages/diorama/src/index.ts'),
    },
  },
})
