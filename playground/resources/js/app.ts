import { createSSRApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { createDiorama } from '@chamoux/diorama'
import StageLayout from './Layouts/StageLayout.vue'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true }) as Record<
      string,
      { default: { layout?: unknown } }
    >
    const page = pages[`./Pages/${name}.vue`]
    // Default every page into the canvas-bearing persistent layout.
    page.default.layout = page.default.layout ?? StageLayout
    return page
  },
  // createSSRApp (not createApp) so the client HYDRATES the server-rendered HTML.
  setup({ el, App, props, plugin }) {
    createSSRApp({ render: () => h(App, props) })
      .use(plugin)
      .use(createDiorama({ renderer: { antialias: true, alpha: true } }))
      .mount(el)
  },
})
