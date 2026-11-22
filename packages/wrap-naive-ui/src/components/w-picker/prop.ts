import type { PopoverProps } from 'naive-ui'
import type { VNode } from 'vue'

export type WPickerOption = {
  /** 展示值 */
  label: string | (() => VNode)
  /** 绑定值 */
  key: string
  /** 图标 */
  icon?: () => VNode
  /** 是否显示，默认 true */
  show?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

/** 自定义筛选：返回 true 表示保留该选项 */
export type WPickerFilter = (val: string, option: WPickerOption) => boolean

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

  placement?: PopoverProps['placement']

  /**
   * 是否开启筛选
   *
   * 默认按选项数量自动判断：`>= 20` 开启，否则关闭；传函数则视为开启并作为匹配规则
   */
  filter?: boolean | WPickerFilter
  /** 筛选输入框占位文案 */
  filterPlaceholder?: string

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
  placement: 'bottom',
} as const satisfies Partial<WPickerProps>
