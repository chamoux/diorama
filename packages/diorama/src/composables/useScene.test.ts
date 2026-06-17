import { describe, it, expect, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

vi.mock('@inertiajs/vue3', () => ({
  usePage: () => ({ component: 'Home', url: '/' }),
}))

import { useScene } from './useScene'
import { Engine } from '../engine/Engine'
import { DIORAMA_KEY } from '../plugin'

describe('useScene', () => {
  it('registers on mount and deregisters on unmount, keyed by page component', () => {
    const engine = new Engine()
    const Comp = defineComponent({
      setup() {
        useScene('home', { enter() {}, leave() {} })
        return () => h('div')
      },
    })
    const app = createApp(Comp)
    app.provide(DIORAMA_KEY, engine)
    app.mount(document.createElement('div'))

    expect(engine.registry.has('Home')).toBe(true)

    app.unmount()
    expect(engine.registry.has('Home')).toBe(false)
  })
})
