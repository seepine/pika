import type { DropdownOption, DropdownProps } from 'naive-ui'
import type { VNode } from 'vue'

/**
 * 下拉选项。naive-ui 的 `key` 为可选，而本组件依赖 key 做值与 label 匹配，
 * 因此收窄为必填。
 * 不把 key 约束到泛型 `K`，避免调用方 computed 数组字面量的 key 被放宽为 `string` 时产生类型冲突
 */
export type WPickerOption = DropdownOption & { key: string }

export interface WPickerProps<K extends string = string> {
  /** 下拉选项，key 为选项值 */
  options: WPickerOption[]
  /** 是否禁用 */
  disabled?: boolean
  /** 触发器大小 */
  size?: 'medium' | 'small'
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 未选中时的占位文案 */
  placeholder: string

  placement?: DropdownProps['placement']
  /**
   * 自定义展示区
   * @returns 返回字符串或 VNode 会作为 trigger 区渲染，返回 `undefined` 表示未选中，将展示 placeholder
   */
  format?: (key: K, option: WPickerOption) => string | VNode | (() => VNode) | undefined
}

export const WPickerDefaults = {
  disabled: false,
  size: 'medium',
  showArrow: true,
} as const satisfies Partial<WPickerProps>
