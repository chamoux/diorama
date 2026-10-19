import { describe, it, expect, vi } from 'vitest'
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three'
import { Engine } from './Engine'
import type { TweenFn } from './TransitionController'

// A synchronous fake tween: runs the animation to completion immediately.
const syncTween: TweenFn = (_target, vars) => {
  ;(vars.onUpdate as (() => void) | undefined)?.()
  ;(vars.onComplete as (() => void) | undefined)?.()
  return { kill: () => {} }
}

function makeEngine() {
  return new Engine({}, { tween: syncTween })
}

describe('Engine', () => {
  it('starts uninitialized with no renderer (SSR-safe) but a built scene/camera/clock', () => {
    const engine = makeEngine()
    expect(engine.isInitialized).toBe(false)
    expect(engine.renderer).toBeNull()
    expect(engine.scene).toBeDefined()
    expect(engine.camera).toBeDefined()
    expect(engine.clock).toBeDefined()
  })

  it('resize updates the camera aspect even before init', () => {
    const engine = makeEngine()
    engine.resize(200, 100)
    expect(engine.camera.aspect).toBe(2)
  })

  it('enter builds a group, adds it to the scene, and runs the enter hook', () => {
    const engine = makeEngine()
    const enter = vi.fn((ctx) => {
      ctx.register('box', new Mesh(new BoxGeometry(), new MeshBasicMaterial()))
    })
    engine.registry.register('Home', 'home', { enter })

    engine.enter('Home')

    expect(enter).toHaveBeenCalledOnce()
    expect(engine.scene.children).toHaveLength(1)
  })

  it('leave runs the leave hook without disposing', () => {
    const engine = makeEngine()
    const leave = vi.fn()
    engine.registry.register('Home', 'home', { enter() {}, leave })
    engine.enter('Home')

    engine.leave('Home')
    expect(leave).toHaveBeenCalledOnce()
  })

  it('navigating to a sceneless component fades out and disposes the active scene', () => {
    const engine = makeEngine()
    engine.registry.register('Home', 'home', {
      enter: (ctx) => { ctx.register('box', new Mesh(new BoxGeometry(), new MeshBasicMaterial())) },
    })
    engine.enter('Home')
    expect(engine.scene.children).toHaveLength(1)

    engine.enter('Unknown') // no registered scene
    expect(engine.scene.children).toHaveLength(0)
  })

  it('onEnter listeners run after the enter hook, with objects already registered', () => {
    const engine = makeEngine()
    engine.registry.register('Home', 'home', {
      enter: (ctx) => { ctx.register('box', new Mesh(new BoxGeometry(), new MeshBasicMaterial())) },
    })
    const seen: unknown[] = []
    engine.onEnter('Home', (ctx) => seen.push(ctx.get('box')))
    engine.onEnter('About', () => seen.push('wrong scene'))

    engine.enter('Home')
    expect(seen).toHaveLength(1)
    expect(seen[0]).toBeInstanceOf(Mesh)
  })

  it('onEnter fires immediately for an already-active scene, and unsubscribes', () => {
    const engine = makeEngine()
    engine.registry.register('Home', 'home', { enter() {} })
    engine.enter('Home')

    const listener = vi.fn()
    const off = engine.onEnter('Home', listener)
    expect(listener).toHaveBeenCalledOnce()

    off()
    engine.enter('Home')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('ctx.load resolves while the scene is active and stays pending once it is left', async () => {
    const engine = makeEngine()
    let release!: (v: string) => void
    const slow = { loadAsync: () => new Promise<string>((r) => { release = r }) }
    const fast = { loadAsync: async (url: string) => url }
    let pending: Promise<string> | undefined
    let ready: Promise<string> | undefined
    engine.registry.register('Home', 'home', {
      enter(ctx) {
        pending = ctx.load(slow, '/slow.glb')
        ready = ctx.load(fast, '/fast.png')
      },
    })
    engine.registry.register('About', 'about', { enter() {} })

    engine.enter('Home')
    await expect(ready).resolves.toBe('/fast.png')

    engine.enter('About')
    release('/slow.glb')
    const settled = await Promise.race([pending!.then(() => true), new Promise((r) => setTimeout(() => r(false), 20))])
    expect(settled).toBe(false)
  })
})
