import { describe, it, expect, vi } from 'vitest'
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three'
import { disposeObject, setGroupOpacity } from './dispose'

function makeMesh() {
  const geometry = new BoxGeometry(1, 1, 1)
  const material = new MeshBasicMaterial()
  return { mesh: new Mesh(geometry, material), geometry, material }
}

describe('disposeObject', () => {
  it('disposes geometry, material, textures, and detaches from parent', () => {
    const group = new Group()
    const { mesh, geometry, material } = makeMesh()
    const fakeTexture = { isTexture: true, dispose: vi.fn() }
    ;(material as unknown as { map: unknown }).map = fakeTexture
    group.add(mesh)

    const geoSpy = vi.spyOn(geometry, 'dispose')
    const matSpy = vi.spyOn(material, 'dispose')

    disposeObject(group)

    expect(geoSpy).toHaveBeenCalledOnce()
    expect(matSpy).toHaveBeenCalledOnce()
    expect(fakeTexture.dispose).toHaveBeenCalledOnce()
    expect(group.parent).toBeNull()
  })
})

describe('setGroupOpacity', () => {
  it('marks materials transparent and sets opacity across the subtree', () => {
    const group = new Group()
    const { mesh, material } = makeMesh()
    group.add(mesh)

    setGroupOpacity(group, 0.25)

    expect(material.transparent).toBe(true)
    expect(material.opacity).toBe(0.25)
  })
})
