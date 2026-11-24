import { computed, inject, type ComputedRef } from 'vue'
import { wConfigProviderInjectionKey, type WComponentOptions } from './config-provider'

/**
 * 合并组件 props，优先级：`prop > provider > defaults`。
 *
 * - 过滤 `undefined`：未传的 prop 不覆盖 provider / defaults
 * - provider 在 `computed` 内读取，父级配置变化时可响应
 *
 * 注意：Boolean prop 未传时 Vue 会置为 `false`，与显式传 `false` 无法区分，
 * 故组件需用 `withDefaults(defineProps<T>(), { xxx: undefined })` 声明。
 */
export function useMergedProps<T extends object>(
  name: keyof WComponentOptions,
  defaults: Partial<T>,
  props: Partial<T>,
): ComputedRef<T> {
  const injected = inject(wConfigProviderInjectionKey, undefined)

  return computed(() => {
    const userProps = Object.fromEntries(
      Object.entries(props).filter(([, v]) => v !== undefined),
    ) as Partial<T>
    const providerProps = injected?.value?.[name] as Partial<T> | undefined
    return Object.assign({}, defaults, providerProps, userProps) as T
  })
}
