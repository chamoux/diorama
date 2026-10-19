<script setup lang="ts">
import { useScene, useScrollChoreography } from '@chamoux/diorama'
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three'
import Nav from '../Components/Nav.vue'

useScene('home', {
  enter(ctx) {
    const box = new Mesh(
      new BoxGeometry(1.6, 1.6, 1.6),
      new MeshBasicMaterial({ color: 0xff5533, wireframe: true }),
    )
    box.name = 'box'
    ctx.register('box', box)
    ctx.camera.position.set(0, 0, 5)
  },
})

// Scrolling the page turns the box and dollies the camera in.
useScrollChoreography((tl, ctx) => {
  const box = ctx.get('box')!
  tl.to(box.rotation, { x: Math.PI, y: Math.PI * 2, ease: 'none' })
    .to(ctx.camera.position, { z: 3, ease: 'none' }, 0)
})
</script>

<template>
  <Nav />
  <h1>Home</h1>
  <p>A red box lives on the persistent canvas behind this text.</p>
  <section class="scroll-section"><p>Scroll down: the box turns with the scrollbar.</p></section>
  <section class="scroll-section"><p>The camera dollies in as you go.</p></section>
  <section class="scroll-section"><p>Scroll back up and it rewinds.</p></section>
</template>
