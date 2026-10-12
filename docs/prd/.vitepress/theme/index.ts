import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import RoleExplorer from './RoleExplorer.vue'
import ShellWireframe from './ShellWireframe.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('RoleExplorer', RoleExplorer)
    app.component('ShellWireframe', ShellWireframe)
  },
} satisfies Theme
