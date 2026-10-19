import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadAsset, preloadAsset, clearAssetCache, type AssetLoader } from './assets'

function fakeLoader() {
  const loadAsync = vi.fn(async (url: string) => ({ url }))
  return { loadAsync } satisfies AssetLoader<{ url: string }>
}

describe('asset cache', () => {
  beforeEach(() => clearAssetCache())

  it('loads once per loader + URL and shares the promise', async () => {
    const loader = fakeLoader()
    const a = loadAsset(loader, '/a.png')
    const b = loadAsset(loader, '/a.png')
    expect(a).toBe(b)
    await expect(a).resolves.toEqual({ url: '/a.png' })
    expect(loader.loadAsync).toHaveBeenCalledOnce()
  })

  it('keys by loader: the same URL through two loaders loads twice', async () => {
    const one = fakeLoader()
    const two = fakeLoader()
    await loadAsset(one, '/a.png')
    await loadAsset(two, '/a.png')
    expect(one.loadAsync).toHaveBeenCalledOnce()
    expect(two.loadAsync).toHaveBeenCalledOnce()
  })

  it('instantiates a loader class once and reuses that instance', async () => {
    const constructed = vi.fn()
    class ClassLoader implements AssetLoader<string> {
      constructor() { constructed() }
      async loadAsync(url: string) { return url }
    }
    await loadAsset(ClassLoader, '/a')
    await loadAsset(ClassLoader, '/b')
    expect(constructed).toHaveBeenCalledOnce()
  })

  it('evicts a failed load so the next call retries', async () => {
    let fail = true
    const loader: AssetLoader<string> = {
      loadAsync: vi.fn(async (url: string) => {
        if (fail) throw new Error('404')
        return url
      }),
    }
    await expect(loadAsset(loader, '/x')).rejects.toThrow('404')
    fail = false
    await expect(loadAsset(loader, '/x')).resolves.toBe('/x')
    expect(loader.loadAsync).toHaveBeenCalledTimes(2)
  })

  it('preloadAsset warms the cache and swallows errors', async () => {
    const loader = fakeLoader()
    preloadAsset(loader, '/a.png')
    await loadAsset(loader, '/a.png')
    expect(loader.loadAsync).toHaveBeenCalledOnce()

    const broken: AssetLoader<never> = { loadAsync: () => Promise.reject(new Error('nope')) }
    expect(() => preloadAsset(broken, '/b')).not.toThrow()
  })

  it('clearAssetCache drops one URL or everything', async () => {
    const loader = fakeLoader()
    await loadAsset(loader, '/a')
    await loadAsset(loader, '/b')
    clearAssetCache('/a')
    await loadAsset(loader, '/a')
    await loadAsset(loader, '/b')
    expect(loader.loadAsync).toHaveBeenCalledTimes(3)

    clearAssetCache()
    await loadAsset(loader, '/b')
    expect(loader.loadAsync).toHaveBeenCalledTimes(4)
  })
})
