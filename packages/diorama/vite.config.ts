import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts'], // don't ship test type-defs in the published dist/
      bundleTypes: false,
      cleanVueFileName: true,
      tsconfigPath: './tsconfig.json',
      processor: 'vue',
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^vue(\/|$)/, /^three/, /^gsap/, /^@inertiajs\/vue3/],
    },
  },
})
