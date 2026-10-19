<script setup lang="ts">
import { useScene } from '@chamoux/diorama'
import { Mesh, TorusGeometry, MeshBasicMaterial, AmbientLight, DirectionalLight } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Nav from '../../Components/Nav.vue'

defineProps<{ slug: string }>()

useScene('work', {
  enter(ctx) {
    ctx.register('torus', new Mesh(
      new TorusGeometry(1, 0.4, 16, 60),
      new MeshBasicMaterial({ color: 0x33dd88, wireframe: true }),
    ))
    ctx.register('ambient', new AmbientLight(0xffffff, 0.6))
    const sun = new DirectionalLight(0xffffff, 2.5)
    sun.position.set(3, 4, 5)
    ctx.register('sun', sun)
    ctx.camera.position.set(0, 0, 4)

    // Lazy asset: the glTF is cached, so clone it rather than share one node between scenes.
    ctx.load(GLTFLoader, '/assets/gem.gltf').then((gltf) => {
      const gem = gltf.scene.clone()
      gem.name = 'gem'
      gem.scale.setScalar(0.5)
      ctx.register('gem', gem)
      ctx.fadeIn('gem')
    })
  },
})
</script>

<template>
  <Nav />
  <h1>Work: {{ slug }}</h1>
  <p>Back/forward navigation crossfades too (driven by the Inertia "navigate" event).</p>
  <p>The gold gem is a glTF model loaded lazily (and preloaded when you hover the Work link).</p>
</template>
