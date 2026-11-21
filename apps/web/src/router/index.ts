import { createRouter, createWebHistory } from 'vue-router'
import { routes as autoRoutes } from 'vue-router/auto-routes'
import { pinia } from '@/stores'
import { setupLayouts } from './layout'
import { i18n } from '@/utils/i18n'
import { resolveTitle } from '@/utils/i18n-title'
import { watch } from 'vue'

const routes = setupLayouts(autoRoutes)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

declare module 'vue-router' {
  /**
   * @example
   * ```ts
   * definePage({
   *   title: '页面标题',
   *   meta: {
   *     authRequired: false,
   *   },
   * })
   * ```
   */
  interface RouteMeta {
    /**
     * 布局组件
     * 注意：只对根页面有效，在子页面声明不会生效
     *   - 有效 src/pages/xxx.vue
     *   - 有效 src/pages/xxx/index.vue
     *   - 无效 src/pages/xxx/yyy.vue
     *
     * 若未设置，则默认根据路径匹配，例如 pages/foo/xxx.vue 页面
     *   - 优先使用 layouts/foo.vue
     *   - 若不存在则使用 layouts/default.vue
     */
    layout?: 'classic' | 'empty' | 'liquid-glass'
    /**
     * 标题
     */
    title?: string
    /**
     * 是否保持路由 alive
     * @default false
     */
    keepAlive?: boolean
    /**
     * 隐藏当前布局的顶部 header（用于全屏内容页）
     *
     * 该 meta 由布局自行实现，自定义布局可参考 classic 的处理方式
     * @default false
     */
    hideHeader?: boolean
    /**
     * 是否需要登录才能访问
     * @default true
     */
    authRequired?: boolean
    /**
     * 是否隐藏该路由，为 true 时不注册到路由表（其子路由同样不注册）
     * @default false
     */
    hide?: boolean
  }
}

const userStore = useUserStore(pinia)
const { config } = useConfigStore(pinia)

const setDocumentTitle = (titleKey?: string) => {
  const title = resolveTitle(titleKey)
  document.title = title ? `${title} - ${config.projectName}` : config.projectName
}

// 匹配管理员命名空间根路径 `/admin` 及其子路径
const isAdminPath = (path: string) => path === '/admin' || path.startsWith('/admin/')

router.beforeEach((to) => {
  setDocumentTitle(to.meta.title)
  if (to.path === '/account/reg' && !config.auth.regEnabled) {
    return '/404'
  }
  // 先处理未登录，保证匿名用户能带着 redirect 进入登录页
  if (!userStore.isLogin && to.meta.authRequired !== false) {
    return {
      path: '/login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
    }
  }
  // 已登录后再校验管理员角色
  if (isAdminPath(to.path) && !userStore.user.roles?.includes('admin')) {
    return '/404'
  }
})

watch(i18n.global.locale, () => {
  setDocumentTitle(router.currentRoute.value.meta.title)
})

export default router
