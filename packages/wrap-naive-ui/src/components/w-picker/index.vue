<!-- 通用 chip 下拉选择器，封装自 n-dropdown -->
<template>
  <n-dropdown
    class="w-picker"
    trigger="click"
    size="small"
    scrollable
    :options="merged.options"
    :value="modelValue"
    :disabled="merged.disabled"
    :placement="merged.placement"
    @select="handleSelect"
  >
    <div
      class="chip-box"
      :class="{
        'chip-box--disabled': merged.disabled,
        'text-size-sm': merged.size === 'medium',
        'text-size-xs': merged.size === 'small',
        'pr-1!': merged.showArrow,
      }"
    >
      <slot name="icon"></slot>
      <span v-if="labelOf === undefined" class="color-text-4">
        {{ merged.placeholder }}
      </span>
      <slot name="default" v-else>
        <component v-if="typeof labelOf === 'function'" :is="labelOf"></component>
        <span v-else>
          {{ labelOf }}
        </span>
      </slot>
      <span
        v-if="merged.showArrow"
        class="i-mdi-chevron-down"
        :class="{
          'text-size-base': merged.size === 'medium',
          'text-size-sm': merged.size === 'small',
        }"
      ></span>
    </div>
  </n-dropdown>
</template>

<script setup lang="ts" generic="K extends string">
import { NDropdown } from 'naive-ui'
import { computed, isVNode, type VNodeChild } from 'vue'
import { useMergedProps } from '../../use-merged-props'
import { WPickerDefaults, type WPickerOption, type WPickerProps } from './prop'

// Boolean 类型 prop 显式声明 undefined，否则未传时会被 Vue 置为 false，覆盖 provider
const defaultProps = withDefaults(defineProps<WPickerProps<K>>(), {
  disabled: undefined,
  showArrow: undefined,
})

const emit = defineEmits<{
  change: [value: K, option: WPickerOption]
}>()

const modelValue = defineModel<K>('value')

const merged = useMergedProps<WPickerProps<K>>('Picker', WPickerDefaults, defaultProps)

/** 递归查找选项，分组与子菜单都通过 children 嵌套 */
const findOption = (
  key: K,
  items: WPickerOption[] = merged.value.options,
): WPickerOption | undefined => {
  for (const item of items) {
    if (item.key === key) {
      return item
    }
    const children = (item as { children?: WPickerOption[] }).children
    if (!children) {
      continue
    }
    const found = findOption(key, children)
    if (found) {
      return found
    }
  }
  return undefined
}

/** 当前值对应的 label，无匹配（或选项无 label）时回退显示 placeholder */
const labelOf = computed<string | (() => VNodeChild) | undefined>(() => {
  const key = modelValue.value
  if (key === undefined) {
    return undefined
  }
  const option = findOption(key)
  if (option === undefined) {
    return undefined
  }
  const fmt = merged.value.format
  if (fmt) {
    const res = fmt(key, option)
    if (isVNode(res)) {
      return () => {
        return res
      }
    }
    return res
  }
  // MenuOption 带 `[key: string]: unknown` 索引签名，label 需显式收窄
  return option.label as string | (() => VNodeChild) | undefined
})

/** 选中选项：值变化时回写 v-model 并触发 change */
const handleSelect = (key: string) => {
  if (merged.value.disabled || key === modelValue.value) {
    return
  }
  const option = findOption(key as K)
  if (!option) {
    return
  }
  modelValue.value = key as K
  emit('change', key as K, option)
}
</script>

<style lang="scss" scoped>
.chip-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: var(--color-text-2);
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover {
    background-color: var(--color-hover);
  }
  &:active {
    background-color: var(--color-active);
  }
  &.chip-box--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>

<style lang="scss">
.w-picker {
  --w-picker-dropdown-height: 400px;
  > .n-scrollbar {
    max-height: min(var(--w-picker-dropdown-height), 90vh);
  }

  .n-dropdown-option-body--group {
    cursor: default !important;
  }
}
</style>
