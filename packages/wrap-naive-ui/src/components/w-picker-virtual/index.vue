<!-- 通用 chip 下拉选择器：n-dropdown 不支持虚拟列表，改用 n-popover(trigger) + n-virtual-list 自实现 -->
<template>
  <n-popover
    trigger="click"
    :show="show"
    :disabled="merged.disabled"
    :placement="merged.placement"
    :show-arrow="false"
    :theme-overrides="popoverThemeOverrides"
    @update:show="handleUpdateShow"
  >
    <template #trigger>
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
        <span v-if="displayLabel === undefined" class="color-text-4">
          {{ merged.placeholder }}
        </span>
        <slot name="default" v-else>
          <component :is="displayLabel" v-if="typeof displayLabel === 'function'"></component>
          <span v-else>
            {{ displayLabel }}
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
    </template>

    <n-input
      v-if="filterable"
      v-model:value="filterValue"
      class="w-picker-virtual-filter"
      style="--n-padding-left: 8px; --n-padding-right: 8px"
      size="small"
      clearable
      :placeholder="merged.filterPlaceholder"
    >
      <template #prefix>
        <span class="i-mdi-magnify"></span>
      </template>
    </n-input>

    <n-virtual-list
      v-if="filteredOptions.length > 0"
      ref="listRef"
      class="w-picker-virtual-list"
      :items="filteredOptions"
      :item-size="itemSize"
      :style="listStyle"
      :scrollbar-props="{
        trigger: 'none',
      }"
      key-field="key"
    >
      <template #default="{ item }">
        <div
          class="w-picker-virtual-option select-none"
          :class="{
            'w-picker-virtual-option--active': item.key === modelValue,
            'w-picker-virtual-option--disabled': item.disabled,
          }"
          @click="handleSelect(item)"
        >
          <component :is="item.icon" v-if="item.icon"></component>
          <span class="w-picker-virtual-option__label">
            <component :is="item.label" v-if="typeof item.label === 'function'"></component>
            <template v-else>{{ item.label }}</template>
          </span>
        </div>
      </template>
    </n-virtual-list>
    <n-empty v-else size="small"></n-empty>
  </n-popover>
</template>

<script setup lang="ts" generic="K extends string">
import {
  NEmpty,
  NInput,
  NPopover,
  NVirtualList,
  useThemeVars,
  type VirtualListInst,
} from 'naive-ui'
import { computed, isVNode, ref, watch, type CSSProperties, type VNode } from 'vue'
import { useMergedProps } from '../../use-merged-props'
import { WPickerVirtualDefaults, type WPickerVirtualOption, type WPickerVirtualProps } from './prop'

// Boolean 类型 prop 显式声明 undefined，否则未传时会被 Vue 置为 false，覆盖 provider
const defaultProps = withDefaults(defineProps<WPickerVirtualProps<K>>(), {
  disabled: undefined,
  showArrow: undefined,
  filter: undefined,
})

const emit = defineEmits<{
  change: [value: K, option: WPickerVirtualOption]
}>()

const modelValue = defineModel<K>('value')

const merged = useMergedProps<WPickerVirtualProps<K>>(
  'PickerVirtual',
  WPickerVirtualDefaults,
  defaultProps,
)

const show = ref(false)

const filterValue = ref('')

/** 关闭弹层并清空筛选词（受控置 false 不会触发 update:show，故需共用此方法） */
const closePopover = () => {
  show.value = false
  filterValue.value = ''
}

const handleUpdateShow = (value: boolean) => {
  if (!value) {
    closePopover()
    return
  }
  show.value = true
}

/** 过滤掉 show: false 的选项，仅用于列表渲染 */
const visibleOptions = computed(() => merged.value.options.filter((item) => item.show !== false))

/** 选项索引，避免大列表下每次渲染都线性查找；含 show: false 的选项，保证触发器仍能展示其 label */
const optionMap = computed(() => new Map(merged.value.options.map((item) => [item.key, item])))

/** 是否展示筛选框：filter 未设置时按选项数量自动判断 */
const filterable = computed(() => {
  const { filter } = merged.value
  if (filter === undefined) {
    return visibleOptions.value.length >= 20
  }
  return filter !== false
})

/** 筛选后的选项，默认按 label（非字符串时用 key）做包含匹配 */
const filteredOptions = computed(() => {
  const keyword = filterValue.value.trim()
  if (!filterable.value || !keyword) {
    return visibleOptions.value
  }
  const { filter } = merged.value
  if (typeof filter === 'function') {
    return visibleOptions.value.filter((option) => filter(keyword, option))
  }
  const lowerKeyword = keyword.toLowerCase()
  return visibleOptions.value.filter((option) => {
    const text = typeof option.label === 'string' ? option.label : option.key
    return text.toLowerCase().includes(lowerKeyword)
  })
})

const listRef = ref<VirtualListInst | null>(null)

// 关键字变化后回到列表顶部，避免停留在旧滚动位置
watch(filterValue, () => listRef.value?.scrollTo({ index: 0 }), { flush: 'post' })

const themeVars = useThemeVars()

/** 选项行高，与虚拟列表 item-size 保持一致 */
const itemSize = computed(() => Number.parseFloat(themeVars.value.heightSmall))

const listStyle = computed<CSSProperties>(() => {
  const vars = themeVars.value
  return {
    '--w-picker-virtual-item-height': vars.heightSmall,
    '--w-picker-virtual-font-size': vars.fontSizeSmall,
    '--w-picker-virtual-text-color': vars.textColor2,
    '--w-picker-virtual-hover-color': vars.hoverColor,
    '--w-picker-virtual-active-color': vars.primaryColor,
    '--w-picker-virtual-radius': vars.borderRadius,
    '--w-picker-virtual-disabled-opacity': vars.opacityDisabled,
  } as CSSProperties
})

/** 弹层内边距与 n-dropdown 对齐 */
const popoverThemeOverrides = { padding: '4px' }

/** 当前值对应的展示内容，无匹配（或选项无 label）时回退展示 placeholder */
const displayLabel = computed<string | (() => VNode) | undefined>(() => {
  const key = modelValue.value
  if (!key) {
    return undefined
  }
  const option = optionMap.value.get(key)
  if (!option) {
    return undefined
  }
  const fmt = merged.value.format
  if (fmt !== undefined) {
    const res = fmt(key, option)
    if (isVNode(res)) {
      return () => {
        return res
      }
    }
    return res
  }
  return option.label
})

/** 选中选项：值变化时回写 v-model 并触发 change */
const handleSelect = (option: WPickerVirtualOption) => {
  if (option.disabled) {
    return
  }
  closePopover()
  const key = option.key as K
  if (key === modelValue.value) {
    return
  }
  modelValue.value = key
  emit('change', key, option)
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

.w-picker-virtual-filter {
  min-width: 140px;
  margin-bottom: 4px;
}

.w-picker-virtual-list {
  max-height: min(310px, 80vh);
  &.n-scrollbar {
    --n-scrollbar-rail-right-vertical-right: 0 !important;
  }
}

.w-picker-virtual-option {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  height: var(--w-picker-virtual-item-height);
  padding: 0 12px;
  border-radius: var(--w-picker-virtual-radius);
  font-size: var(--w-picker-virtual-font-size);
  color: var(--w-picker-virtual-text-color);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    background-color: var(--w-picker-virtual-hover-color);
  }
  &--active {
    color: var(--w-picker-virtual-active-color);
    background-color: color-mix(in srgb, var(--w-picker-virtual-active-color) 10%, transparent);
  }
  &--disabled {
    opacity: var(--w-picker-virtual-disabled-opacity);
    pointer-events: none;
  }
}

.w-picker-virtual-option__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
