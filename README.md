# Diorama

Persistent WebGL scenes for Inertia + Vue. One Three.js canvas that lives across
Inertia page visits instead of being torn down on every navigation, with a
declarative per-page scene lifecycle and a default crossfade between scenes.

**SSR-safe** — the plugin builds only Three.js objects on the server; the WebGL
renderer and all DOM/router wiring are deferred to the client, so it renders and
hydrates cleanly under Inertia SSR.

## Install

```bash
npm install @chamoux/diorama three gsap
```

See the [package README](packages/diorama/README.md) for setup and the full API.

## Repo layout

This is a pnpm monorepo:

- **[`packages/diorama`](packages/diorama)** — the published library (`@chamoux/diorama`): a Vue 3 plugin, the `DioramaCanvas` component, and the `useScene` composable. ESM, TypeScript.
- **[`playground`](playground)** — a Laravel 12 + Inertia v3 + Vue 3 sandbox that demonstrates and validates the library, including server-side rendering.
- **`e2e`** — Playwright end-to-end tests (persistence, disposal, hydration).

## Development

```bash
pnpm install

pnpm --filter @chamoux/diorama test     # unit tests
pnpm --filter @chamoux/diorama build    # build the library
pnpm test:e2e                           # end-to-end tests

# run the demo (two terminals):
pnpm dev:playground                     # Vite dev server
cd playground && php artisan serve      # Laravel
```

## License

MIT
