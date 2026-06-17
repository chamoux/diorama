import { createInertiaApp } from '@inertiajs/vue3'
import createServer from '@inertiajs/vue3/server'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { createDiorama } from '@chamoux/diorama'
import StageLayout from './Layouts/StageLayout.vue'

// Inertia SSR entry. Runs in Node — must NOT touch WebGL/DOM. Diorama is safe here:
// createDiorama() builds only Three.js Scene/Camera/Clock (pure JS); the WebGLRenderer
// and all router/DOM wiring are deferred to DioramaCanvas.onMounted (client-only).
createServer((page) =>
  createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('./Pages/**/*.vue', { eager: true }) as Record<
        string,
        { default: { layout?: unknown } }
      >
      const p = pages[`./Pages/${name}.vue`]
      p.default.layout = p.default.layout ?? StageLayout
      return p
    },
    setup({ App, props, plugin }) {
      return createSSRApp({ render: () => h(App, props) })
        .use(plugin)
        .use(createDiorama({ renderer: { antialias: true, alpha: true } }))
    },
  }),
)
