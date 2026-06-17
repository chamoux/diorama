<script setup lang="ts">
import { onMounted } from 'vue'
import { DioramaCanvas, useEngine } from '@chamoux/diorama'

// Sandbox hook: expose the engine for E2E assertions (and future devtools).
const engine = useEngine()
onMounted(() => { (window as unknown as { __diorama: unknown }).__diorama = engine })
</script>

<template>
  <DioramaCanvas class="diorama-canvas" />
  <main class="page"><slot /></main>
</template>

<style>
.diorama-canvas { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.page { position: relative; z-index: 10; padding: 2rem; font-family: system-ui, sans-serif; }
.page nav a { margin-right: 1rem; }
</style>
