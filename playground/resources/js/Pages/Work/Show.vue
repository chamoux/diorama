<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { useScene } from '@chamoux/diorama'
import { Mesh, TorusGeometry, MeshBasicMaterial } from 'three'

defineProps<{ slug: string }>()

useScene('work', {
  enter(ctx) {
    ctx.register('torus', new Mesh(
      new TorusGeometry(1, 0.4, 16, 60),
      new MeshBasicMaterial({ color: 0x33dd88, wireframe: true }),
    ))
    ctx.camera.position.set(0, 0, 4)
  },
})
</script>

<template>
  <nav>
    <Link href="/">Home</Link>
    <Link href="/about">About</Link>
    <Link href="/work/alpha">Work</Link>
  </nav>
  <h1>Work: {{ slug }}</h1>
  <p>Back/forward navigation crossfades too (driven by the Inertia "navigate" event).</p>
</template>
