/**
 * Anything with a three.js-style `loadAsync(url)`: TextureLoader, GLTFLoader,
 * FileLoader, a configured loader instance, or your own.
 */
export interface AssetLoader<T> {
  loadAsync(url: string): Promise<T>
}

/** A loader class (one shared instance is created lazily) or a configured instance. */
export type AssetLoaderSource<T> = AssetLoader<T> | (new () => AssetLoader<T>)

// Keyed by the loader class or instance you pass, then by URL. Holds promises, so
// concurrent requests for the same asset share one network fetch + parse.
const cache = new Map<object, Map<string, Promise<unknown>>>()
const sharedLoaders = new WeakMap<object, AssetLoader<unknown>>()

function resolveLoader<T>(source: AssetLoaderSource<T>): AssetLoader<T> {
  if (typeof source !== 'function') return source
  let loader = sharedLoaders.get(source) as AssetLoader<T> | undefined
  if (!loader) {
    loader = new source()
    sharedLoaders.set(source, loader)
  }
  return loader
}

/**
 * Load an asset once and cache it for the rest of the session. Repeat calls with
 * the same loader and URL return the same promise; a failed load is evicted so the
 * next call retries. Client-side only.
 */
export function loadAsset<T>(loader: AssetLoaderSource<T>, url: string): Promise<T> {
  let byUrl = cache.get(loader)
  if (!byUrl) {
    byUrl = new Map()
    cache.set(loader, byUrl)
  }
  const hit = byUrl.get(url)
  if (hit) return hit as Promise<T>

  const promise = resolveLoader(loader).loadAsync(url)
  byUrl.set(url, promise)
  promise.catch(() => {
    if (byUrl.get(url) === promise) byUrl.delete(url)
  })
  return promise
}

/** Warm the cache ahead of time (e.g. on link hover). Errors are swallowed. */
export function preloadAsset<T>(loader: AssetLoaderSource<T>, url: string): void {
  loadAsset(loader, url).catch(() => {})
}

/** Drop one URL from the cache (for every loader), or everything when called with no URL. */
export function clearAssetCache(url?: string): void {
  if (url === undefined) {
    cache.clear()
    return
  }
  for (const byUrl of cache.values()) byUrl.delete(url)
}
