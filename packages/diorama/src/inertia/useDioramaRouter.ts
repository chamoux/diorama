import { router, usePage } from '@inertiajs/vue3'
import type { Engine } from '../engine/Engine'

interface PageRef {
  component: string
  url: string
}

export function useDioramaRouter(engine: Engine): () => void {
  const page = usePage()
  let current: PageRef = { component: page.component, url: page.url }

  // Leave + enter only once a visit has actually landed on a different page. Inertia's
  // `before` also fires for reloads, polls, prefetches and cancelled visits, none of
  // which change the page, so it can't be used to run `leave`.
  const applyVisit = (next: PageRef) => {
    if (next.component === current.component && next.url === current.url) return
    engine.leave(current.component)
    engine.enter(next.component)
    current = { component: next.component, url: next.url }
  }

  const offs = [
    router.on('success', (e: { detail: { page: PageRef } }) => applyVisit(e.detail.page)),
    router.on('navigate', (e: { detail: { page: PageRef } }) => applyVisit(e.detail.page)),
  ]

  return () => offs.forEach((off) => off())
}
