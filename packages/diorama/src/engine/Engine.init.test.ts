import { describe, it, expect, vi } from 'vitest'

// jsdom has no WebGL: stand in for the renderer, keeping the rest of three real.
const renderers: Array<{ domElement: HTMLCanvasElement; dispose: ReturnType<typeof vi.fn>; forceContextLoss: ReturnType<typeof vi.fn> }> = []
vi.mock('three', async (importOriginal) => {
  const three = await importOriginal<typeof import('three')>()
  class FakeRenderer {
    domElement: HTMLCanvasElement
    dispose = vi.fn()
    forceContextLoss = vi.fn()
    constructor({ canvas }: { canvas: HTMLCanvasElement }) {
      this.domElement = canvas
      renderers.push(this)
    }
    setPixelRatio() {}
    setSize() {}
    render() {}
  }
  return { ...three, WebGLRenderer: FakeRenderer }
})

import { Engine } from './Engine'

describe('Engine.init / detach', () => {
  it('reuses the renderer when the same canvas is initialised again', () => {
    renderers.length = 0
    const engine = new Engine()
    const canvas = document.createElement('canvas')
    engine.init(canvas)
    engine.detach()
    engine.init(canvas)
    expect(renderers).toHaveLength(1)
    engine.dispose()
  })

  it('binds a fresh renderer to a new canvas after a remount and releases the old one', () => {
    renderers.length = 0
    const engine = new Engine()
    engine.init(document.createElement('canvas'))
    engine.detach()
    const second = document.createElement('canvas')
    engine.init(second)

    expect(renderers).toHaveLength(2)
    expect(renderers[0]!.dispose).toHaveBeenCalled()
    expect(renderers[0]!.forceContextLoss).toHaveBeenCalled()
    expect(engine.renderer!.domElement).toBe(second)
    engine.dispose()
  })

  it('detach stops the loop for good: becoming visible again does not restart it', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const engine = new Engine()
    engine.init(document.createElement('canvas'))
    engine.detach()
    raf.mockClear()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(raf).not.toHaveBeenCalled()
    raf.mockRestore()
    engine.dispose()
  })
})
