import type {
  Scene, Group, PerspectiveCamera, WebGLRenderer, Clock, Object3D, WebGLRendererParameters,
} from 'three'
import type { MaybeRefOrGetter } from 'vue'
import type { gsap } from 'gsap'
import type { AssetLoaderSource } from './assets/assets'

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
  /**
   * Cached {@link loadAsset}, scoped to this scene: the promise only settles while the
   * scene is still the active one, so a slow load never lands in a scene you left.
   */
  load<T>(loader: AssetLoaderSource<T>, url: string): Promise<T>
}

/** The GSAP timeline handed to a {@link useScrollChoreography} builder. */
export type DioramaTimeline = ReturnType<typeof gsap.timeline>

export interface ScrollChoreographyOptions {
  /**
   * Element (or selector) whose scroll range drives the timeline. Read when the
   * scene enters, so a template ref works. Default: the whole document.
   */
  trigger?: MaybeRefOrGetter<Element | string | null | undefined>
  /** ScrollTrigger start. Default `'top top'`. */
  start?: string | number
  /** ScrollTrigger end. Default `'bottom bottom'`. */
  end?: string | number
  /** `true` locks the timeline to the scrollbar; a number smooths it over that many seconds. Default `true`. */
  scrub?: boolean | number
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
