# Diorama Playground

A minimal Laravel 12 + Inertia v3 + Vue 3 app used to develop and validate
[`@chamoux/diorama`](../packages/diorama) against real Inertia navigations.

It proves the core promise: one persistent `<canvas>` survives page visits while
each route registers its own scene, and Diorama crossfades between them.

## Routes

- `/` — Home (a red wireframe box)
- `/about` — About (a blue wireframe sphere)
- `/work/{slug}` — Work (a green wireframe torus)

Navigating between them keeps the same canvas mounted and crossfades the scenes.

## Run it

From the **repo root** (the canvas library is consumed from source via a Vite alias):

```bash
# 1. install workspace deps
pnpm install

# 2. start Vite (terminal 1)
pnpm --filter playground dev

# 3. start the app (terminal 2)
cd playground && php artisan serve
```

Open http://127.0.0.1:8000 and click between Home / About / Work.

## SSR

This sandbox is also wired for Inertia SSR, which doubles as proof that Diorama is
SSR-safe (the engine builds only Three.js objects on the server; WebGL/DOM are
deferred to the client). To run it server-rendered:

```bash
pnpm --filter playground build        # builds client + bootstrap/ssr/ssr.js
pnpm --filter playground ssr &        # start the SSR server (port 13714)
cd playground && php artisan serve    # Laravel dispatches to the SSR server
```

The initial HTML then includes the server-rendered `<canvas>` and page; the client
hydrates it cleanly and initializes WebGL on mount.

> This app is a dev sandbox only — it is not published and is excluded from the
> `@chamoux/diorama` npm package.
