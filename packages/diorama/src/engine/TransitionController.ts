import { gsap } from 'gsap'
import type { SceneInstance } from '../types'
import { setGroupOpacity } from './dispose'

export interface TweenHandle {
  kill(): void
}

export type TweenFn = (target: object, vars: Record<string, unknown>) => TweenHandle

interface TransitionDeps {
  duration: number
  tween?: TweenFn
  onDisposeInstance: (inst: SceneInstance) => void
}

export class TransitionController {
  private readonly duration: number
  private readonly tween: TweenFn
  private readonly onDispose: (inst: SceneInstance) => void
  private activeTween: TweenHandle | null = null
  private pendingOutgoing: SceneInstance | null = null

  constructor(deps: TransitionDeps) {
    this.duration = deps.duration
    this.onDispose = deps.onDisposeInstance
    this.tween = deps.tween ?? ((target, vars) => gsap.to(target, vars) as unknown as TweenHandle)
  }

  get isAnimating(): boolean {
    return this.activeTween !== null
  }

  private interrupt(): void {
    if (this.activeTween) {
      this.activeTween.kill()
      this.activeTween = null
    }
    if (this.pendingOutgoing) {
      this.onDispose(this.pendingOutgoing)
      this.pendingOutgoing = null
    }
  }

  private finish(): void {
    if (this.pendingOutgoing) {
      this.onDispose(this.pendingOutgoing)
      this.pendingOutgoing = null
    }
    this.activeTween = null
  }

  crossfade(outgoing: SceneInstance | null, incoming: SceneInstance | null): void {
    this.interrupt()
    this.pendingOutgoing = outgoing
    const proxy = { t: 0 }
    this.activeTween = this.tween(proxy, {
      t: 1,
      duration: this.duration,
      ease: 'none',
      onUpdate: () => {
        if (incoming) setGroupOpacity(incoming.group, proxy.t)
        if (outgoing) setGroupOpacity(outgoing.group, 1 - proxy.t)
      },
      onComplete: () => this.finish(),
    })
  }

  fadeOutAlone(outgoing: SceneInstance): void {
    this.interrupt()
    this.pendingOutgoing = outgoing
    const proxy = { t: 1 }
    this.activeTween = this.tween(proxy, {
      t: 0,
      duration: this.duration,
      ease: 'none',
      onUpdate: () => setGroupOpacity(outgoing.group, proxy.t),
      onComplete: () => this.finish(),
    })
  }

  disposeAll(): void {
    this.interrupt()
  }
}
