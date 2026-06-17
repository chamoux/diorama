<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useEngine } from '../plugin'
import { useDioramaRouter } from '../inertia/useDioramaRouter'

const engine = useEngine()
const canvasEl = ref<HTMLCanvasElement | null>(null)
let unwire: (() => void) | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return

  engine.init(canvas)
  engine.start()
  unwire = useDioramaRouter(engine)
  // DioramaCanvas and the slotted page are SIBLINGS in the layout, and the canvas
  // mounts first — so the page's useScene hasn't registered yet at this point. Defer the
  // initial enter to nextTick, after the page's onMounted registration in this same flush.
  nextTick(() => engine.enter(usePage().component))

  // Observe the canvas itself: its content-box equals its CSS size — the viewport for a
  // `fixed inset-0` canvas, or its parent's box for a block canvas. ResizeObserver fires
  // once on observe (initial sizing) and on every CSS-size change. Safe from feedback
  // loops because engine.resize() calls setSize(w, h, false), which never touches CSS.
  observer = new ResizeObserver(([entry]) => {
    if (entry) engine.resize(entry.contentRect.width, entry.contentRect.height)
  })
  observer.observe(canvas)
})

onBeforeUnmount(() => {
  // Stop the loop + unwire listeners, but intentionally do NOT engine.dispose():
  // the canvas is meant to persist for the app's lifetime, and a remount should
  // reuse the same renderer/GPU context. Full teardown is left to engine.dispose().
  observer?.disconnect()
  unwire?.()
  engine.stop()
})
</script>

<template>
  <!-- width/height:100% so the canvas (a replaced element) fills its positioning box;
       e.g. with a `fixed inset-0` class it fills the viewport. inset:0 alone won't stretch it. -->
  <canvas ref="canvasEl" style="display: block; width: 100%; height: 100%"></canvas>
</template>
