<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { useScene } from '@chamoux/diorama'
import { Mesh, SphereGeometry, MeshBasicMaterial } from 'three'

useScene('about', {
  enter(ctx) {
    ctx.register('sphere', new Mesh(
      new SphereGeometry(1.1, 24, 16),
      new MeshBasicMaterial({ color: 0x3388ff, wireframe: true }),
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
  <h1>About</h1>
  <p>Navigating here crossfades the box into a sphere — same canvas, no remount.</p>
</template>
