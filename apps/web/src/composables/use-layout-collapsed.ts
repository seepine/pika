import { systemInfo } from '@/composables/system'

/**
 * 布局侧栏折叠状态
 *
 * - 宽屏：`collapsed` 控制左栏收起/展开
 * - 窄屏：`collapsed` 反向充当抽屉开关，`false` 表示抽屉展开
 *
 * 通过 `c-layout-collapsed` 向 left-area 与 header 的折叠按钮共享同一份状态。
 */
export const useLayoutCollapsed = () => {
  const collapsed = ref(!systemInfo.value.md)
  provide('c-layout-collapsed', collapsed)

  const drawerShow = computed(() => !collapsed.value)

  // 抽屉被遮罩/ESC 关闭时回写折叠态
  const handleDrawerShowUpdate = (show: boolean) => {
    if (!show) {
      collapsed.value = true
    }
  }

  // 窗口跨过断点时复位
  watch(
    () => systemInfo.value.md,
    (isDesktop) => {
      collapsed.value = !isDesktop
    },
  )

  return { collapsed, drawerShow, handleDrawerShowUpdate }
}
