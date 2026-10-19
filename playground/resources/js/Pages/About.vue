<script setup lang="ts">
import { useScene } from '@chamoux/diorama'
import { Mesh, SphereGeometry, MeshBasicMaterial, TextureLoader, SRGBColorSpace } from 'three'
import Nav from '../Components/Nav.vue'

useScene('about', {
  enter(ctx) {
    ctx.register('sphere', new Mesh(
      new SphereGeometry(1.1, 24, 16),
      new MeshBasicMaterial({ color: 0x3388ff, wireframe: true }),
    ))
    ctx.camera.position.set(0, 0, 4)

    // Lazy asset: fetched on first visit, cached after; fades in when ready.
    ctx.load(TextureLoader, '/assets/checker.png').then((texture) => {
      texture.colorSpace = SRGBColorSpace
      const globe = new Mesh(new SphereGeometry(0.8, 32, 16), new MeshBasicMaterial({ map: texture }))
      globe.name = 'globe'
      ctx.register('globe', globe)
      ctx.fadeIn('globe')
    })
  },
})
</script>

<template>
  <Nav />
  <h1>About</h1>
  <p>Navigating here crossfades the box into a sphere — same canvas, no remount.</p>
  <p>The checkered globe is a texture loaded lazily with <code>ctx.load</code>.</p>
</template>
