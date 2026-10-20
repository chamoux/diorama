import { Scene, PerspectiveCamera, Clock, Group, WebGLRenderer } from 'three'
import type { Object3D } from 'three'
import { markRaw } from 'vue'
import { gsap } from 'gsap'
import type { DioramaOptions, SceneContext, SceneHooks, SceneInstance } from '../types'
import { SceneRegistry } from './SceneRegistry'
import { TransitionController, type TweenFn } from './TransitionController'
import { createLoop, type Loop } from './loop'
import { disposeObject, setGroupOpacity } from './dispose'
import { loadAsset } from '../assets/assets'

export interface EngineDeps {
  /** Test-only seam: inject a synchronous tween to make transitions deterministic. */
  tween?: TweenFn
}

export class Engine {
  readonly scene: Scene
  readonly camera: PerspectiveCamera
  renderer: WebGLRenderer | null = null
  readonly clock: Clock
  readonly registry: SceneRegistry

  private readonly options: DioramaOptions
  private readonly dprCap: number
  private readonly transitions: TransitionController
  private loop: Loop | null = null
  private active: SceneInstance | null = null
  /** Hooks the active scene entered with; its page may have unregistered by the time it leaves. */
  private activeHooks: SceneHooks | null = null
  private readonly enterListeners = new Map<string, Set<(ctx: SceneContext) => void>>()

  constructor(options: DioramaOptions = {}, deps: EngineDeps = {}) {
    this.options = options
    this.dprCap = options.dprCap ?? 2
    this.scene = markRaw(new Scene())
    this.camera = markRaw(new PerspectiveCamera(50, 1, 0.1, 1000))
    this.clock = markRaw(new Clock())
    this.registry = new SceneRegistry()
    this.transitions = new TransitionController({
      duration: options.transition?.duration ?? 0.6,
      tween: deps.tween,
      onDisposeInstance: (inst) => {
        disposeObject(inst.group)
        inst.objects.clear()
      },
    })
  }

  get isInitialized(): boolean {
    return this.renderer !== null
  }

  init(canvas: HTMLCanvasElement): void {
    if (typeof window === 'undefined') return
    if (this.renderer?.domElement !== canvas) {
      // A remounted DioramaCanvas (e.g. after a page with another layout) brings a new
      // <canvas>; the old renderer is bound to the detached one, so replace it. Scene
      // objects survive and re-upload to the new context on the next frame.
      if (this.renderer) {
        this.renderer.dispose()
        this.renderer.forceContextLoss()
      }
      this.renderer = markRaw(new WebGLRenderer({ canvas, ...this.options.renderer }))
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.dprCap))
      // Prevent the default so the GPU context can be restored after a loss.
      canvas.addEventListener('webglcontextlost', (e) => e.preventDefault(), false)
    }
    this.loop ??= createLoop((delta) => this.tick(delta))
    this.start()
  }

  /**
   * Stop rendering until the next {@link init}, for when the canvas unmounts. Unlike
   * {@link stop}, a tab becoming visible again won't restart the loop. Scenes and the
   * renderer are kept.
   */
  detach(): void {
    this.loop?.dispose()
    this.loop = null
  }

  private tick(_delta: number): void {
    this.renderer?.render(this.scene, this.camera)
  }

  start(): void {
    this.loop?.start()
  }

  stop(): void {
    this.loop?.stop()
  }

  resize(width: number, height: number): void {
    if (height === 0) return
    this.renderer?.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  enter(component: string): void {
    const reg = this.registry.get(component)
    if (!reg) {
      if (this.active) {
        const outgoing = this.active
        this.active = null
        this.activeHooks = null
        this.transitions.fadeOutAlone(outgoing)
      }
      return
    }
    const group = markRaw(new Group())
    this.scene.add(group)
    const instance: SceneInstance = { component, name: reg.name, group, objects: new Map() }
    const ctx = this.buildContext(instance)
    reg.hooks.enter?.(ctx)
    this.enterListeners.get(component)?.forEach((listener) => listener(ctx))
    setGroupOpacity(group, 0)
    const prev = this.active
    this.active = instance
    this.activeHooks = reg.hooks
    this.transitions.crossfade(prev, instance)
  }

  /**
   * Run `listener` with the scene context each time `component`'s scene enters, after
   * its own `enter` hook. Fires immediately if that scene is already active.
   * Returns an unsubscribe function.
   */
  onEnter(component: string, listener: (ctx: SceneContext) => void): () => void {
    let listeners = this.enterListeners.get(component)
    if (!listeners) {
      listeners = new Set()
      this.enterListeners.set(component, listeners)
    }
    listeners.add(listener)
    if (this.active?.component === component) listener(this.buildContext(this.active))
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0 && this.enterListeners.get(component) === listeners) {
        this.enterListeners.delete(component)
      }
    }
  }

  leave(component: string): void {
    if (!this.active || this.active.component !== component) return
    this.activeHooks?.leave?.(this.buildContext(this.active))
  }

  dispose(): void {
    this.stop()
    this.transitions.disposeAll()
    if (this.active) {
      disposeObject(this.active.group)
      this.active.objects.clear()
      this.active = null
      this.activeHooks = null
    }
    this.loop?.dispose()
    this.renderer?.dispose()
    this.renderer = null
  }

  private buildContext(instance: SceneInstance): SceneContext {
    const defaultDuration = this.options.transition?.duration ?? 0.6
    const tweenOpacity = (obj: Object3D | undefined, to: number, duration?: number) => {
      const proxy = { v: to === 1 ? 0 : 1 }
      // Apply the start value now so a freshly registered object can't flash for a frame.
      if (obj) setGroupOpacity(obj, proxy.v)
      return gsap.to(proxy, {
        v: to,
        duration: duration ?? defaultDuration,
        ease: 'none',
        onUpdate: () => { if (obj) setGroupOpacity(obj, proxy.v) },
      })
    }
    return {
      scene: instance.group,
      camera: this.camera,
      renderer: this.renderer as WebGLRenderer,
      clock: this.clock,
      register: (name, obj) => {
        instance.objects.set(name, obj)
        instance.group.add(obj)
        setGroupOpacity(obj, 1)
        return obj
      },
      get: (name) => instance.objects.get(name) as never,
      fadeIn: (name, opts) => tweenOpacity(instance.objects.get(name), 1, opts?.duration),
      fadeOut: (name, opts) => tweenOpacity(instance.objects.get(name), 0, opts?.duration),
      load: (loader, url) =>
        new Promise((resolve, reject) => {
          // Settle only while this scene is still the active one; otherwise stay pending.
          loadAsset(loader, url).then(
            (asset) => { if (this.active === instance) resolve(asset) },
            (error) => { if (this.active === instance) reject(error) },
          )
        }),
    }
  }
}
