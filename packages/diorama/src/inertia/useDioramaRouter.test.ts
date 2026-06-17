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
  it('leaves on before, enters on success/navigate, and gates same-component visits', () => {
    const engine = new Engine()
    const leave = vi.spyOn(engine, 'leave').mockImplementation(() => {})
    const enter = vi.spyOn(engine, 'enter').mockImplementation(() => {})

    const unwire = useDioramaRouter(engine)

    handlers.before!()
    expect(leave).toHaveBeenCalledWith('Home')

    handlers.success!({ detail: { page: { component: 'About', url: '/about' } } })
    expect(enter).toHaveBeenCalledWith('About')

    enter.mockClear()
    handlers.success!({ detail: { page: { component: 'About', url: '/about' } } }) // same -> gated
    expect(enter).not.toHaveBeenCalled()

    handlers.navigate!({ detail: { page: { component: 'Home', url: '/' } } })
    expect(enter).toHaveBeenCalledWith('Home')

    unwire()
  })
})
