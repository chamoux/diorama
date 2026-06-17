export interface Loop {
  start(): void
  stop(): void
  dispose(): void
}

interface LoopDeps {
  raf?: typeof requestAnimationFrame
  caf?: typeof cancelAnimationFrame
  doc?: Document
}

export function createLoop(onTick: (delta: number) => void, deps: LoopDeps = {}): Loop {
  const raf = deps.raf ?? requestAnimationFrame
  const caf = deps.caf ?? cancelAnimationFrame
  const doc = deps.doc ?? document

  let handle = 0
  let running = false
  let last = 0
  let firstFrame = true

  const frame = (now: number) => {
    if (!running) return
    const delta = firstFrame ? 0 : (now - last) / 1000
    firstFrame = false
    last = now
    onTick(delta)
    handle = raf(frame)
  }

  const start = () => {
    if (running) return
    running = true
    firstFrame = true
    handle = raf(frame)
  }

  const stop = () => {
    if (!running) return
    running = false
    caf(handle)
  }

  const onVisibility = () => {
    if (doc.hidden) stop()
    else start()
  }

  doc.addEventListener('visibilitychange', onVisibility)

  return {
    start,
    stop,
    dispose() {
      stop()
      doc.removeEventListener('visibilitychange', onVisibility)
    },
  }
}
