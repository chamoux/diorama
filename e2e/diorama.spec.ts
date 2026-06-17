import { test, expect, type Page } from '@playwright/test'

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
  await expect(page).toHaveURL(/127\.0\.0\.1:8000\/$/)
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
