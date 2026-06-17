import type { Material, Mesh, Object3D, Texture } from 'three'

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material as unknown as Record<string, unknown>)) {
    if (value && (value as Texture).isTexture) {
      ;(value as Texture).dispose()
    }
  }
  material.dispose()
}

export function disposeObject(obj: Object3D): void {
  obj.traverse((child) => {
    const mesh = child as Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const material = mesh.material
    if (material) {
      if (Array.isArray(material)) material.forEach(disposeMaterial)
      else disposeMaterial(material)
    }
  })
  obj.removeFromParent()
}

export function setGroupOpacity(obj: Object3D, value: number): void {
  obj.traverse((child) => {
    const mesh = child as Mesh
    const material = mesh.material
    if (!material) return
    const materials = Array.isArray(material) ? material : [material]
    for (const m of materials) {
      m.transparent = true
      m.opacity = value
    }
  })
}
