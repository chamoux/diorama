import type { RegisteredScene, SceneHooks } from '../types'

export class SceneRegistry {
  private scenes = new Map<string, RegisteredScene>()

  register(component: string, name: string, hooks: SceneHooks): RegisteredScene {
    const scene: RegisteredScene = { component, name, hooks }
    this.scenes.set(component, scene)
    return scene
  }

  get(component: string): RegisteredScene | undefined {
    return this.scenes.get(component)
  }

  has(component: string): boolean {
    return this.scenes.has(component)
  }

  deregister(component: string): void {
    this.scenes.delete(component)
  }
}
