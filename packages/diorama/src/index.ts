export { createDiorama, useEngine, DIORAMA_KEY } from './plugin'
export { default as DioramaCanvas } from './components/DioramaCanvas.vue'
export { useScene } from './composables/useScene'
export { useScrollChoreography } from './composables/useScrollChoreography'
export { loadAsset, preloadAsset, clearAssetCache } from './assets/assets'
export type { AssetLoader, AssetLoaderSource } from './assets/assets'
export type {
  DioramaOptions,
  SceneContext,
  SceneHooks,
  DioramaTween,
  DioramaTimeline,
  ScrollChoreographyOptions,
  RegisteredScene,
  SceneInstance,
} from './types'
