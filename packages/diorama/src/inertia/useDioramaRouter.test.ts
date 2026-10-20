import { describe, it, expect, vi } from 'vitest'

const { handlers } = vi.hoisted(() => ({ handlers: {} as Record<string, (e?: unknown) => void> }))

vi.mock('@inertiajs/vue3', () => ({
  usePage: () => ({ component: 'Home', url: '/' }),
  router: {
    on: (event: string, cb: (e?: unknown) => void) => {
      handlers[event] = cb
      return () => { delete handlers[event] }
    },
  },
}))

import { useDioramaRouter } from './useDioramaRouter'
import { Engine } from '../engine/Engine'

describe('useDioramaRouter', () => {
  it('leaves then enters on success/navigate, and gates same-page visits', () => {
    const engine = new Engine()
    const calls: string[] = []
    vi.spyOn(engine, 'leave').mockImplementation((c) => { calls.push(`leave:${c}`) })
    vi.spyOn(engine, 'enter').mockImplementation((c) => { calls.push(`enter:${c}`) })

    const unwire = useDioramaRouter(engine)

    handlers.success!({ detail: { page: { component: 'About', url: '/about' } } })
    expect(calls).toEqual(['leave:Home', 'enter:About'])

    calls.length = 0
    handlers.success!({ detail: { page: { component: 'About', url: '/about' } } }) // same -> gated
    expect(calls).toEqual([])

    handlers.navigate!({ detail: { page: { component: 'Home', url: '/' } } })
    expect(calls).toEqual(['leave:About', 'enter:Home'])

    unwire()
  })

  it('does not listen to `before`: reloads, polls and prefetches must not run leave', () => {
    const engine = new Engine()
    const leave = vi.spyOn(engine, 'leave').mockImplementation(() => {})
    const unwire = useDioramaRouter(engine)

    expect(handlers.before).toBeUndefined()
    // A reload / poll lands on the same page: no leave.
    handlers.success!({ detail: { page: { component: 'Home', url: '/' } } })
    expect(leave).not.toHaveBeenCalled()

    unwire()
  })
})
