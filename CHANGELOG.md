# Changelog

All notable changes to `@chamoux/diorama`. The API may still change before 1.0.

## 0.1.1

### Fixed

- `leave` hooks no longer run on reloads, polls (`router.poll`), link prefetches or
  cancelled visits. They now run once a visit lands on a different page, right before
  the crossfade.
- The canvas renders again after visiting a page whose layout doesn't include
  `DioramaCanvas`. Previously the renderer stayed bound to the old, detached canvas.
- The render loop no longer restarts in the background when the tab becomes visible
  while the canvas is unmounted.

### Changed

- `llms.txt` now ships in the npm package; package description and keywords cover the
  0.1 features.

## 0.1.0

### Added

- `useScrollChoreography(build, options?)`: bind a scrubbed GSAP ScrollTrigger timeline
  to the page's scene. Rebuilt each time the scene enters, killed on page unmount.
- Lazy, cached asset loading: `ctx.load(loader, url)` (resolves only while the scene is
  still active), `loadAsset`, `preloadAsset` and `clearAssetCache`. Works with any
  three.js loader.

### Fixed

- `ctx.fadeIn` / `ctx.fadeOut` apply their start opacity immediately, so a newly
  registered object can't flash for a frame.

## 0.0.3

- Docs: demo GIF in the READMEs; roadmap vs. shipped features clarified.

## 0.0.2

- Docs: problem framing in the README; broader npm keywords.

## 0.0.1

- Initial release: persistent canvas across Inertia navigation, per-page `useScene`
  lifecycle, automatic crossfade, SSR-safe render and hydrate.
