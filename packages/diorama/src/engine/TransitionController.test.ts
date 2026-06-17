import { describe, it, expect, vi } from 'vitest'
import { Group } from 'three'
import { TransitionController, type TweenFn } from './TransitionController'
import type { SceneInstance } from '../types'

function inst(component: string): SceneInstance {
  return { component, name: component, group: new Group(), objects: new Map() }
}

describe('TransitionController', () => {
  it('disposes the outgoing scene when the crossfade completes', () => {
    const disposed: SceneInstance[] = []
    let vars: { onComplete?: () => void } = {}
    const tween: TweenFn = (_t, v) => { vars = v; return { kill: vi.fn() } }
    const tc = new TransitionController({ duration: 0.6, tween, onDisposeInstance: (i) => disposed.push(i) })

    const a = inst('A'), b = inst('B')
    tc.crossfade(a, b)
    expect(tc.isAnimating).toBe(true)

    vars.onComplete!()
    expect(disposed).toEqual([a])
    expect(tc.isAnimating).toBe(false)
  })

  it('interrupting a crossfade kills it and disposes the first pending outgoing immediately', () => {
    const disposed: SceneInstance[] = []
    const kills: Array<ReturnType<typeof vi.fn>> = []
    const tween: TweenFn = () => { const kill = vi.fn(); kills.push(kill); return { kill } }
    const tc = new TransitionController({ duration: 0.6, tween, onDisposeInstance: (i) => disposed.push(i) })

    const a = inst('A'), b = inst('B'), c = inst('C')
    tc.crossfade(a, b)
    tc.crossfade(b, c)

    expect(disposed).toContain(a)
    expect(kills[0]).toHaveBeenCalledOnce()
  })

  it('fadeOutAlone disposes the outgoing on complete', () => {
    const disposed: SceneInstance[] = []
    let vars: { onComplete?: () => void } = {}
    const tween: TweenFn = (_t, v) => { vars = v; return { kill: vi.fn() } }
    const tc = new TransitionController({ duration: 0.6, tween, onDisposeInstance: (i) => disposed.push(i) })

    const a = inst('A')
    tc.fadeOutAlone(a)
    vars.onComplete!()
    expect(disposed).toEqual([a])
  })
})
