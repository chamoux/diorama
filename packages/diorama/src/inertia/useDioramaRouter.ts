import { router, usePage } from '@inertiajs/vue3'
import type { Engine } from '../engine/Engine'

interface PageRef {
  component: string
  url: string
}

export function useDioramaRouter(engine: Engine): () => void {
  const page = usePage()
  let current: PageRef = { component: page.component, url: page.url }

  const applyEnter = (next: PageRef) => {
    if (next.component === current.component && next.url === current.url) return
    engine.enter(next.component)
    current = { component: next.component, url: next.url }
  }

  const offs = [
    router.on('before', () => engine.leave(current.component)),
    router.on('success', (e: { detail: { page: PageRef } }) => applyEnter(e.detail.page)),
    router.on('navigate', (e: { detail: { page: PageRef } }) => applyEnter(e.detail.page)),
  ]

  return () => offs.forEach((off) => off())
}
