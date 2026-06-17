# @chamoux/diorama

Persistent WebGL scenes for Inertia + Vue. One Three.js canvas that lives across
Inertia page visits instead of being torn down on every navigation, with a
declarative per-page scene lifecycle and a default crossfade between scenes.

**SSR-safe:** the plugin builds only Three.js objects on the server; the WebGL
renderer and all DOM/router wiring are deferred to the client (`onMounted`), so it
renders and hydrates cleanly under Inertia SSR.

## Why

Two problems show up the moment you put serious 3D into a Laravel/Inertia (or any Vue SPA) app:

1. **Inertia remounts your canvas on every navigation.** Inertia swaps the page
   component on each visit, so a `<canvas>` that lives inside a page is unmounted and
   recreated — you lose the WebGL context, loaded geometry, and all continuity. What you
   want is one canvas that *persists* across page visits and morphs from one route's
   scene to the next.
2. **Scroll choreography is hand-rolled every time.** Binding a GSAP timeline to scroll
   and driving camera/object/material state by hand is the same glue on every project.

Diorama solves both by riding Inertia's **persistent layouts**: it mounts one Three.js
renderer once, keeps the WebGL context alive across navigation, and gives you a
declarative per-page scene lifecycle with crossfades.

## Install

```bash
npm install @chamoux/diorama three gsap
```

Peer dependencies: `vue` ^3.4, `three` >=0.160, `gsap` ^3.12, and (optional)
`@inertiajs/vue3` ^1 || ^2 || ^3.

## Setup

Register the plugin in your Inertia entry (`resources/js/app.ts`):

```ts
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { createDiorama } from '@chamoux/diorama'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[`./Pages/${name}.vue`]
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(createDiorama({ renderer: { antialias: true, alpha: true } }))
      .mount(el)
  },
})
```

Put the canvas in a **persistent layout** (this is what keeps the WebGL context alive):

```vue
<script setup>
import { DioramaCanvas } from '@chamoux/diorama'
</script>

<template>
  <DioramaCanvas class="fixed inset-0 -z-10" />
  <main class="relative z-10"><slot /></main>
</template>
```

**Sizing:** The `<canvas>` fills its positioning box. The common case is a
full-screen stage: give it `position: fixed; inset: 0` (e.g. Tailwind
`fixed inset-0`) and it fills the viewport. For a non-fixed canvas, make sure its
parent has a definite height, otherwise the canvas resolves to zero height.

Register a scene per page:

```vue
<script setup>
import { useScene } from '@chamoux/diorama'
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three'

useScene('home', {
  enter(ctx) {
    ctx.register('box', new Mesh(new BoxGeometry(), new MeshBasicMaterial()))
    ctx.camera.position.set(0, 0, 5)
  },
})
</script>
```

On navigation, Diorama runs the outgoing scene's `leave`, the incoming scene's
`enter`, and crossfades between them — the canvas never remounts.

## API

| Export | Purpose |
|--------|---------|
| `createDiorama(options)` | Vue plugin; creates the shared renderer/scene/camera |
| `DioramaCanvas` | the single persistent `<canvas>`; place it in a persistent layout |
| `useScene(name, hooks)` | register `enter`/`leave` for the current page (`name` is a display label; the scene is keyed by the Inertia page component) |

## License

MIT
