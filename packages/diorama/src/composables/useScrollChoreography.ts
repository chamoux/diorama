import { onMounted, onUnmounted, toValue } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { gsap } from 'gsap'
import { useEngine } from '../plugin'
import type { DioramaTimeline, SceneContext, ScrollChoreographyOptions } from '../types'

/**
 * Bind a scrubbed GSAP timeline to this page's scene. `build` runs each time the
 * scene enters (after its `enter` hook, so registered objects are available) and
 * fills the timeline; scroll position then drives its progress. The timeline and its
 * ScrollTrigger are killed when the page unmounts. Call it next to `useScene`.
 */
export function useScrollChoreography(
  build: (tl: DioramaTimeline, ctx: SceneContext) => void,
  options: ScrollChoreographyOptions = {},
): void {
  const engine = useEngine()
  const component = usePage().component
  let timeline: DioramaTimeline | null = null
  let off: (() => void) | null = null
  let unmounted = false

  const kill = () => {
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null
  }

  onMounted(async () => {
    // Loaded on the client only: the server never needs it, and Node can't resolve this
    // subpath on gsap < 3.15 (no exports map). If the scene entered meanwhile, onEnter
    // fires immediately for it.
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    if (unmounted) return
    gsap.registerPlugin(ScrollTrigger)
    off = engine.onEnter(component, (ctx) => {
      kill()
      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: toValue(options.trigger) ?? document.documentElement,
          start: options.start ?? 'top top',
          end: options.end ?? 'bottom bottom',
          scrub: options.scrub ?? true,
        },
      })
      build(timeline, ctx)
    })
  })

  onUnmounted(() => {
    unmounted = true
    off?.()
    off = null
    kill()
  })
}
