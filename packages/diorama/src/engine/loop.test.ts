import { describe, it, expect, vi } from 'vitest'
import { createLoop } from './loop'

function makeFakeDoc() {
  const handlers: Record<string, Array<() => void>> = {}
  return {
    hidden: false,
    addEventListener: (type: string, fn: () => void) => {
      ;(handlers[type] ??= []).push(fn)
    },
    removeEventListener: (type: string, fn: () => void) => {
      handlers[type] = (handlers[type] ?? []).filter((h) => h !== fn)
    },
    fire: (type: string) => (handlers[type] ?? []).forEach((h) => h()),
  }
}

function makeFakeRaf() {
  let cb: ((t: number) => void) | null = null
  const raf = (fn: (t: number) => void) => { cb = fn; return 1 }
  const caf = vi.fn()
  return { raf: raf as unknown as typeof requestAnimationFrame, caf: caf as unknown as typeof cancelAnimationFrame, drive: (t: number) => cb?.(t) }
}

describe('createLoop', () => {
  it('ticks with a delta and stops on demand', () => {
    const onTick = vi.fn()
    const { raf, caf, drive } = makeFakeRaf()
    const doc = makeFakeDoc()
    const loop = createLoop(onTick, { raf, caf, doc: doc as unknown as Document })

    loop.start()
    drive(0)
    expect(onTick).toHaveBeenLastCalledWith(0)
    drive(1000)
    expect(onTick).toHaveBeenLastCalledWith(1)

    loop.stop()
    expect(caf).toHaveBeenCalled()
  })

  it('pauses when the document is hidden and resumes when visible', () => {
    const onTick = vi.fn()
    const { raf, caf, drive } = makeFakeRaf()
    const doc = makeFakeDoc()
    const loop = createLoop(onTick, { raf, caf, doc: doc as unknown as Document })

    loop.start()
    drive(0)
    onTick.mockClear()

    doc.hidden = true
    doc.fire('visibilitychange')
    expect(caf).toHaveBeenCalled()

    doc.hidden = false
    doc.fire('visibilitychange')
    drive(5000)
    expect(onTick).toHaveBeenLastCalledWith(0) // first resumed tick ignores the hidden gap

    loop.dispose()
  })
})
