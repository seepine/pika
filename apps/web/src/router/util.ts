/**
 * 路由相关的纯函数工具，不依赖 router 实例，组件里可随意复用
 */

import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * 站内首页地址列表，作为「首页」判断依据
 *
 * 首页目前参与两处判定：
 * - `g-layout-header`：窄屏下首页展示菜单入口（抽屉），其他页面只展示返回按钮
 * - `liquid-glass` 布局：仅首页渲染壁纸，内容页用纯色背景
 */
export const homeUrls = ['/dashboard']

/** 去掉末尾斜杠，让 `/dashboard` 与 `/dashboard/` 视为同一地址 */
const normalizePath = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

/** 是否为首页 */
export const isHomeUrl = (path: string) =>
  homeUrls.some((url) => normalizePath(url) === normalizePath(path))

/**
 * 是否存在「站内」上一页
 *
 * vue-router 会把上一条路由地址写入 `window.history.state.back`，为 null 表示首次进入站点。
 * 不能用 `window.history.length > 1` 判断，它包含进入本站之前的历史记录。
 */
export const hasBackRoute = () => typeof window.history.state?.back === 'string'

/**
 * 计算 keep-alive 的 key
 *
 * 只取「本层路由记录」（matched 中第二个带 components 的记录），
 * 直接用 `viewRoute.path` 会混入子路由参数，导致父实例重建、状态丢失。
 */
export const calcKeepAliveKey = (viewRoute: RouteLocationNormalizedLoaded): string => {
  const record = viewRoute.matched.filter((item) => item.components)[1]
  if (!record) {
    return viewRoute.path
  }
  const params = (record.path.match(/:[A-Za-z0-9_]+/g) ?? []).map((token) => {
    const value = (viewRoute.params as Record<string, unknown>)[token.slice(1)]
    return `${token}=${value ?? ''}`
  })
  return [record.path, ...params].join('|')
}
