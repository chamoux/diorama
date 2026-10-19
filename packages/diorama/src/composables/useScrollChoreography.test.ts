import { describe, it, expect, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

vi.mock('@inertiajs/vue3', () => ({
  usePage: () => ({ component: 'Home', url: '/' }),
}))

// jsdom has no matchMedia; ScrollTrigger needs it to register.
window.matchMedia ??= (query: string) =>
  ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList

import { Object3D } from 'three'
import { useScrollChoreography } from './useScrollChoreography'
import { Engine } from '../engine/Engine'
import { DIORAMA_KEY } from '../plugin'
import type { DioramaTimeline } from '../types'

const syncTween = (_t: object, vars: Record<string, unknown>) => {
  ;(vars.onUpdate as (() => void) | undefined)?.()
  ;(vars.onComplete as (() => void) | undefined)?.()
  return { kill: () => {} }
}

async function mountPage(engine: Engine, build: (tl: DioramaTimeline) => void) {
  const Page = defineComponent({
    setup() {
      useScrollChoreography((tl) => build(tl))
      return () => h('div')
    },
  })
  const app = createApp(Page)
  app.provide(DIORAMA_KEY, engine)
  app.mount(document.createElement('div'))
  await vi.dynamicImportSettled() // ScrollTrigger is imported lazily in onMounted
  return app
}

describe('useScrollChoreography', () => {
  it('builds a ScrollTrigger-bound timeline when the scene enters, after the enter hook', async () => {
    const engine = new Engine({}, { tween: syncTween })
    const target = new Object3D()
    engine.registry.register('Home', 'home', {
      enter: (ctx) => { ctx.register('target', target) },
    })
    const timelines: DioramaTimeline[] = []
    const app = await mountPage(engine, (tl) => {
      tl.to(target.position, { x: 10, duration: 1 })
      timelines.push(tl)
    })

    expect(timelines).toHaveLength(0) // nothing until the scene enters
    engine.enter('Home')
    expect(timelines).toHaveLength(1)
    expect(timelines[0]!.scrollTrigger).toBeDefined()
    app.unmount()
  })

  it('rebuilds on re-enter and kills the timeline + trigger on unmount', async () => {
    const engine = new Engine({}, { tween: syncTween })
    engine.registry.register('Home', 'home', { enter() {} })
    const timelines: DioramaTimeline[] = []
    const app = await mountPage(engine, (tl) => timelines.push(tl))

    engine.enter('Home')
    const killFirst = vi.spyOn(timelines[0]!.scrollTrigger!, 'kill')
    engine.enter('Home')
    expect(timelines).toHaveLength(2)
    expect(killFirst).toHaveBeenCalled() // the rebuild replaced the first timeline

    const killSecond = vi.spyOn(timelines[1]!.scrollTrigger!, 'kill')
    app.unmount()
    expect(killSecond).toHaveBeenCalled()

    engine.enter('Home') // listener removed: no further builds
    expect(timelines).toHaveLength(2)
  })

  it('builds for a scene that entered before ScrollTrigger finished loading', async () => {
    const engine = new Engine({}, { tween: syncTween })
    engine.registry.register('Home', 'home', { enter() {} })
    const timelines: DioramaTimeline[] = []
    const Page = defineComponent({
      setup() {
        useScrollChoreography((tl) => timelines.push(tl))
        return () => h('div')
      },
    })
    const app = createApp(Page)
    app.provide(DIORAMA_KEY, engine)
    app.mount(document.createElement('div'))
    engine.enter('Home') // before the lazy import resolves
    await vi.dynamicImportSettled()
    expect(timelines).toHaveLength(1)
    app.unmount()
  })

  it('does nothing if the page unmounts before ScrollTrigger finished loading', async () => {
    const engine = new Engine({}, { tween: syncTween })
    engine.registry.register('Home', 'home', { enter() {} })
    const build = vi.fn()
    const Page = defineComponent({
      setup() {
        useScrollChoreography(build)
        return () => h('div')
      },
    })
    const app = createApp(Page)
    app.provide(DIORAMA_KEY, engine)
    app.mount(document.createElement('div'))
    app.unmount()
    await vi.dynamicImportSettled()
    engine.enter('Home')
    expect(build).not.toHaveBeenCalled()
  })
})
