import { test, expect, type Page } from '@playwright/test'

// The home page URL on whatever port the suite runs on (see E2E_PORT in playwright.config.ts).
const HOME_URL = /127\.0\.0\.1:\d+\/$/

// The playground exposes the engine on window.__diorama (sandbox hook).
async function waitEngineReady(page: Page) {
  await page.waitForFunction(
    () => {
      const d = (window as unknown as { __diorama?: { scene: { children: unknown[] } } }).__diorama
      return !!d && Array.isArray(d.scene.children) && d.scene.children.length >= 1
    },
    null,
    { timeout: 10_000 },
  )
}

const groupCount = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __diorama: { scene: { children: unknown[] } } }).__diorama.scene.children.length,
  )

test('serves the app with a Diorama canvas', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas.diorama-canvas')).toBeVisible()
})

test('initializes a WebGL context on the canvas', async ({ page }) => {
  await page.goto('/')
  await waitEngineReady(page)
  const hasGL = await page.evaluate(() => {
    const c = document.querySelector('canvas')!
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  })
  expect(hasGL).toBe(true)
})

test('keeps the SAME canvas DOM node across an Inertia navigation', async ({ page }) => {
  await page.goto('/')
  await waitEngineReady(page)
  await page.evaluate(() => ((document.querySelector('canvas') as unknown as { __tag: string }).__tag = 'persist-fwd'))
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  const same = await page.evaluate(
    () => (document.querySelector('canvas') as unknown as { __tag?: string }).__tag === 'persist-fwd',
  )
  expect(same).toBe(true)
})

test('keeps the same canvas across browser back/forward', async ({ page }) => {
  await page.goto('/')
  await waitEngineReady(page)
  await page.evaluate(() => ((document.querySelector('canvas') as unknown as { __tag: string }).__tag = 'persist-back'))
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.goBack()
  await expect(page).toHaveURL(HOME_URL)
  const same = await page.evaluate(
    () => (document.querySelector('canvas') as unknown as { __tag?: string }).__tag === 'persist-back',
  )
  expect(same).toBe(true)
})

test('produces no console errors while navigating all routes', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await waitEngineReady(page)
  for (const name of ['About', 'Work', 'Home', 'About']) {
    await page.getByRole('link', { name }).first().click()
    await page.waitForTimeout(300)
  }
  expect(errors).toEqual([])
})

test('does not leak scene groups: stays within the crossfade cap and settles to 1', async ({ page }) => {
  await page.goto('/')
  await waitEngineReady(page)
  // keep rAF warm so the GSAP-driven crossfades actually advance during the run
  await page.evaluate(() => {
    const spin = () => {
      ;(window as unknown as { __spin: number }).__spin = requestAnimationFrame(spin)
    }
    spin()
  })

  let maxGroups = 0
  for (const name of ['About', 'Work', 'Home', 'About', 'Work', 'Home']) {
    await page.getByRole('link', { name }).first().click()
    await page.waitForTimeout(250)
    maxGroups = Math.max(maxGroups, await groupCount(page))
  }
  // During a crossfade you have outgoing + incoming = 2; interrupt disposes the older.
  // It must never exceed 2 (that would mean undisposed/leaked scenes).
  expect(maxGroups).toBeLessThanOrEqual(2)

  // And once idle it returns to a single active scene (outgoing disposed).
  await expect.poll(() => groupCount(page), { timeout: 6_000 }).toBe(1)
})

// --- Scroll choreography + lazy assets -------------------------------------------------

type DioramaHandle = {
  scene: { getObjectByName(n: string): Record<string, any> | undefined }
  camera: unknown
  renderer: { render(s: unknown, c: unknown): void; getContext(): WebGLRenderingContext }
}

const boxRotationY = (page: Page) =>
  page.evaluate(() => {
    const d = (window as unknown as { __diorama: DioramaHandle }).__diorama
    return (d.scene.getObjectByName('box')?.rotation.y as number | undefined) ?? Number.NaN
  })

/** Render a frame and read the centre pixel's alpha in the same task (drawing buffer is still valid). */
const centreAlpha = (page: Page) =>
  page.evaluate(() => {
    const d = (window as unknown as { __diorama: DioramaHandle }).__diorama
    d.renderer.render(d.scene, d.camera)
    const gl = d.renderer.getContext()
    const px = new Uint8Array(4)
    gl.readPixels(gl.drawingBufferWidth >> 1, gl.drawingBufferHeight >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    return px[3]
  })

const objectReady = (page: Page, name: string) =>
  page.evaluate((n) => {
    const d = (window as unknown as { __diorama: DioramaHandle }).__diorama
    const obj = d.scene.getObjectByName(n)
    if (!obj) return 'missing'
    let opacity = 1
    obj.traverse((c: { material?: { opacity: number } }) => { if (c.material) opacity = Math.min(opacity, c.material.opacity) })
    return opacity > 0.99 ? 'ready' : 'fading'
  }, name)

test('scroll choreography: scrolling Home turns the box, scrolling back rewinds it', async ({ page }) => {
  await page.goto('/')
  await waitEngineReady(page)
  await expect.poll(() => boxRotationY(page)).toBeCloseTo(0, 2)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => boxRotationY(page)).toBeGreaterThan(6) // 2π at the bottom

  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => boxRotationY(page)).toBeCloseTo(0, 2)
})

test('scroll choreography is rebuilt after leaving Home and coming back', async ({ page }) => {
  await page.goto('/')
  await waitEngineReady(page)
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page).toHaveURL(HOME_URL)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __diorama: { scene: { children: unknown[] } } }).__diorama.scene.children.length), { timeout: 6_000 }).toBe(1)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => boxRotationY(page)).toBeGreaterThan(6)
})

test('lazy texture: About loads the checker texture and fades the globe in', async ({ page }) => {
  await page.goto('/about')
  await waitEngineReady(page)
  await expect.poll(() => objectReady(page, 'globe'), { timeout: 6_000 }).toBe('ready')
  const width = await page.evaluate(() => {
    const d = (window as unknown as { __diorama: DioramaHandle }).__diorama
    return d.scene.getObjectByName('globe')!.material.map.image.width as number
  })
  expect(width).toBe(256)
  expect(await centreAlpha(page)).toBeGreaterThan(200) // the globe is actually drawn at the centre
})

test('lazy glTF: Work loads the model, preloads on hover, and revisits hit the cache', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (r) => { if (r.url().endsWith('/assets/gem.gltf')) requests.push(r.url()) })

  await page.goto('/')
  await waitEngineReady(page)
  await page.getByRole('link', { name: 'Work' }).hover()
  await expect.poll(() => requests.length).toBe(1) // preloaded before the click

  await page.getByRole('link', { name: 'Work' }).click()
  await expect(page).toHaveURL(/\/work\/alpha$/)
  await expect.poll(() => objectReady(page, 'gem'), { timeout: 6_000 }).toBe('ready')
  expect(await centreAlpha(page)).toBeGreaterThan(200)

  // Leave (the scene and its GPU resources are disposed), then come back.
  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page).toHaveURL(HOME_URL)
  await page.waitForTimeout(800)
  await page.getByRole('link', { name: 'Work' }).click()
  await expect.poll(() => objectReady(page, 'gem'), { timeout: 6_000 }).toBe('ready')
  expect(await centreAlpha(page)).toBeGreaterThan(200) // re-uploaded after disposal, still drawn
  expect(requests).toHaveLength(1) // served from the asset cache
})

test('a slow asset never lands in a scene you already left', async ({ page }) => {
  // Hold the texture response until after we navigate away from About.
  let release!: () => void
  const held = new Promise<void>((r) => { release = r })
  await page.route('**/assets/checker.png', async (route) => { await held; await route.continue() })

  await page.goto('/')
  await waitEngineReady(page)
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page).toHaveURL(HOME_URL)
  // Release while About is still fading out, then watch every frame: an unguarded load
  // would register the globe into the outgoing scene for the rest of the crossfade.
  const sawGlobe = page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const d = (window as unknown as { __diorama: DioramaHandle }).__diorama
        const until = performance.now() + 1_000
        const check = () => {
          if (d.scene.getObjectByName('globe')) return resolve(true)
          if (performance.now() > until) return resolve(false)
          requestAnimationFrame(check)
        }
        check()
      }),
  )
  release()
  expect(await sawGlobe).toBe(false)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __diorama: { scene: { children: unknown[] } } }).__diorama.scene.children.length), { timeout: 6_000 }).toBe(1)
})

// --- Leave hooks + canvas remount ------------------------------------------------------

type RouterHandle = {
  reload(o: { onFinish: () => void }): void
  prefetch(url: string, o: object, p: { cacheFor: number }): void
}

/** Count engine.leave() calls from here on (the router calls it on the engine instance). */
const countLeaves = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __diorama: { leave: (c: string) => void }; __leaves: string[] }
    w.__leaves = []
    const original = w.__diorama.leave.bind(w.__diorama)
    w.__diorama.leave = (c: string) => { w.__leaves.push(c); original(c) }
  })
const leaves = (page: Page) => page.evaluate(() => (window as unknown as { __leaves: string[] }).__leaves)

test('reloads and prefetches do not run the leave hook; a real visit does', async ({ page }) => {
  await page.goto('/')
  await waitEngineReady(page)
  await countLeaves(page)

  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        (window as unknown as { __router: RouterHandle }).__router.reload({ onFinish: () => resolve() }),
      ),
  )
  await page.evaluate(() => (window as unknown as { __router: RouterHandle }).__router.prefetch('/about', {}, { cacheFor: 0 }))
  await page.waitForTimeout(500)
  expect(await leaves(page)).toEqual([])
  expect(await boxRotationY(page)).not.toBeNaN() // the Home scene is still there

  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect.poll(() => leaves(page)).toEqual(['Home'])
})

test('the canvas renders again after visiting a page with a different layout', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/about')
  await waitEngineReady(page)
  await page.getByRole('link', { name: 'No canvas' }).click()
  await expect(page).toHaveURL(/\/plain$/)
  await expect(page.locator('canvas')).toHaveCount(0)

  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('canvas.diorama-canvas')).toBeVisible()
  await expect.poll(() => objectReady(page, 'globe'), { timeout: 6_000 }).toBe('ready')
  const bound = await page.evaluate(() => {
    const d = (window as unknown as { __diorama: { renderer: { domElement: Element } } }).__diorama
    return d.renderer.domElement === document.querySelector('canvas')
  })
  expect(bound).toBe(true)
  expect(await centreAlpha(page)).toBeGreaterThan(200)
  expect(errors).toEqual([])
})
