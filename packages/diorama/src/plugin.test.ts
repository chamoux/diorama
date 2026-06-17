import { describe, it, expect } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createDiorama, useEngine } from './plugin'
import { Engine } from './engine/Engine'

describe('createDiorama / useEngine', () => {
  it('provides an Engine that useEngine retrieves', () => {
    let captured: Engine | null = null
    const Child = defineComponent({
      setup() { captured = useEngine(); return () => h('div') },
    })
    const app = createApp(Child)
    app.use(createDiorama())
    app.mount(document.createElement('div'))

    expect(captured).toBeInstanceOf(Engine)
    app.unmount()
  })

  it('useEngine throws when the plugin is not installed', () => {
    let threw = false
    const Child = defineComponent({
      setup() {
        try { useEngine() } catch { threw = true }
        return () => h('div')
      },
    })
    const app = createApp(Child)
    app.mount(document.createElement('div'))
    expect(threw).toBe(true)
    app.unmount()
  })
})
