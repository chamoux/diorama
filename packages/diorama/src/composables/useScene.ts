import { onMounted, onUnmounted } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useEngine } from '../plugin'
import type { SceneHooks } from '../types'

export function useScene(name: string, hooks: SceneHooks): void {
  const engine = useEngine()
  const component = usePage().component

  onMounted(() => {
    engine.registry.register(component, name, hooks)
  })

  onUnmounted(() => {
    engine.registry.deregister(component)
  })
}
