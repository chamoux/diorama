<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { useScene } from '@chamoux/diorama'
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three'

useScene('home', {
  enter(ctx) {
    ctx.register('box', new Mesh(
      new BoxGeometry(1.6, 1.6, 1.6),
      new MeshBasicMaterial({ color: 0xff5533, wireframe: true }),
    ))
    ctx.camera.position.set(0, 0, 5)
  },
})
</script>

<template>
  <nav>
    <Link href="/">Home</Link>
    <Link href="/about">About</Link>
    <Link href="/work/alpha">Work</Link>
  </nav>
  <h1>Home</h1>
  <p>A red box lives on the persistent canvas behind this text.</p>
</template>
