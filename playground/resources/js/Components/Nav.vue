<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { preloadAsset } from '@chamoux/diorama'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Warm the Work page's model while the pointer is on its link, so it is ready on arrival.
const preloadWork = () => preloadAsset(GLTFLoader, '/assets/gem.gltf')
</script>

<template>
  <nav>
    <Link href="/">Home</Link>
    <Link href="/about">About</Link>
    <Link href="/work/alpha" @mouseenter="preloadWork">Work</Link>
  </nav>
</template>
