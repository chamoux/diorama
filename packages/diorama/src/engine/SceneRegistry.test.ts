import { describe, it, expect } from 'vitest'
import { SceneRegistry } from './SceneRegistry'

describe('SceneRegistry', () => {
  it('registers, gets, has, and deregisters scenes by component key', () => {
    const registry = new SceneRegistry()
    const hooks = { enter() {}, leave() {} }

    registry.register('Home', 'home', hooks)
    expect(registry.has('Home')).toBe(true)
    expect(registry.get('Home')).toEqual({ component: 'Home', name: 'home', hooks })

    registry.deregister('Home')
    expect(registry.has('Home')).toBe(false)
    expect(registry.get('Home')).toBeUndefined()
  })
})
