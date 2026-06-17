import type {
  Scene, Group, PerspectiveCamera, WebGLRenderer, Clock, Object3D, WebGLRendererParameters,
} from 'three'

/**
 * Handle returned by {@link SceneContext.fadeIn}/{@link SceneContext.fadeOut}.
 * At runtime this is a GSAP Tween; typed as a minimal contract so the published
 * declarations stay self-contained (no dependency on gsap's ambient namespace).
 */
export interface DioramaTween {
  kill(): void
}

export interface DioramaOptions {
  renderer?: WebGLRendererParameters
  /** Cap for renderer.setPixelRatio. Default 2. */
  dprCap?: number
  transition?: {
    /** Crossfade duration in seconds. Default 0.6. */
    duration?: number
  }
}

export interface SceneContext {
  /** This scene's root group (already added to the shared Scene). */
  scene: Group
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  clock: Clock
  register(name: string, obj: Object3D): Object3D
  get<T extends Object3D = Object3D>(name: string): T | undefined
  fadeIn(name: string, opts?: { duration?: number }): DioramaTween
  fadeOut(name: string, opts?: { duration?: number }): DioramaTween
}

export interface SceneHooks {
  enter?(ctx: SceneContext): void
  leave?(ctx: SceneContext): void
}

export interface RegisteredScene {
  component: string
  name: string
  hooks: SceneHooks
}

export interface SceneInstance {
  component: string
  name: string
  group: Group
  objects: Map<string, Object3D>
}

/** Unused alias kept so `Scene` import is referenced by consumers of this file. */
export type DioramaScene = Scene
