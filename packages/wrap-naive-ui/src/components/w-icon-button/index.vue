<!-- 仅渲染一个图标按钮（quaternary 样式），封装自 n-button -->
<template>
  <n-button
    class="w-icon-button"
    :size="typeof merged.size === 'number' ? undefined : merged.size"
    :type="merged.type"
    :disabled="merged.disabled"
    quaternary
    style="--n-padding: 0 0px; width: var(--n-height)"
    :style="compStyle"
    @click="handleClick"
  >
    <template #icon>
      <slot></slot>
    </template>
  </n-button>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed } from 'vue'
import { useMergedProps } from '../../use-merged-props'
import { WIconButtonDefaults, type WIconButtonProps } from './prop'

// Boolean 类型 prop 显式声明 undefined，否则未传时会被 Vue 置为 false，覆盖 provider
const defaultProps = withDefaults(defineProps<WIconButtonProps>(), {
  disabled: undefined,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const merged = useMergedProps<WIconButtonProps>('IconButton', WIconButtonDefaults, defaultProps)

// 按 size / iconSize 派生 CSS 变量
const compStyle = computed(() => {
  const style = { ...merged.value.style }

  const { size, borderRadius } = merged.value
  if (borderRadius) {
    Object.assign(style, { '--n-border-radius': `${borderRadius}px` })
  }
  if (typeof size === 'number') {
    Object.assign(style, { '--n-height': `${size}px` })
  }
  if (merged.value.iconSize) {
    style['--n-icon-size'] = `${merged.value.iconSize}px`
  }
  return style
})

const handleClick = (e: MouseEvent) => {
  if (merged.value.href) {
    window.open(merged.value.href, '_blank', 'noopener,noreferrer')
  }
  e.preventDefault()
  emit('click', e)
}
</script>

<style lang="scss"></style>
