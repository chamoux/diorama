<script setup lang="ts">
import { onMounted } from 'vue'
import { router } from '@inertiajs/vue3'
import { DioramaCanvas, useEngine } from '@chamoux/diorama'

// Sandbox hooks: expose the engine and router for E2E assertions (and future devtools).
const engine = useEngine()
onMounted(() => {
  Object.assign(window, { __diorama: engine, __router: router })
})
</script>

<template>
  <DioramaCanvas class="diorama-canvas" />
  <main class="page"><slot /></main>
</template>

<style>
.diorama-canvas { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.page { position: relative; z-index: 10; padding: 2rem; font-family: system-ui, sans-serif; }
.page nav a { margin-right: 1rem; }
.scroll-section { min-height: 90vh; display: flex; align-items: center; }
</style>
