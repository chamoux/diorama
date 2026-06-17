import { inject, type App, type InjectionKey, type Plugin } from 'vue'
import { Engine } from './engine/Engine'
import type { DioramaOptions } from './types'

export const DIORAMA_KEY: InjectionKey<Engine> = Symbol('diorama')

export function createDiorama(options: DioramaOptions = {}): Plugin {
  return {
    install(app: App) {
      app.provide(DIORAMA_KEY, new Engine(options))
    },
  }
}

export function useEngine(): Engine {
  const engine = inject(DIORAMA_KEY)
  if (!engine) {
    throw new Error('[diorama] useEngine() requires the createDiorama plugin to be installed.')
  }
  return engine
}
