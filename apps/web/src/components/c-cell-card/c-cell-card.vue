<template>
  <div class="c-cell-card" :style="styleVars">
    <div v-if="title || $slots.title" class="px-2 color-text-2 text-xs select-none pb-2">
      <slot name="title">{{ title }}</slot>
    </div>
    <n-card content-class="p-0!">
      <np-cell-group bordered :options="options"></np-cell-group>
    </n-card>
  </div>
</template>
<script setup lang="tsx">
import type { NpCellGroupOption } from 'naive-plus'

const props = withDefaults(
  defineProps<{
    title?: string
    align?: 'start' | 'center' | 'end'
    /** 图标容器尺寸，数字按 px 处理；仅控制外框，内联 svg 需自行指定尺寸 */
    iconSize?: number | string
    options: NpCellGroupOption[]
  }>(),
  {
    align: 'center',
    iconSize: 24,
  },
)
/** 数字统一转成 px，字符串原样透传（如 1.5rem、2em） */
const toCssSize = (size: number | string) => (typeof size === 'number' ? `${size}px` : size)
const alignMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
}
const styleVars = computed(() => {
  return {
    '--c-cell-align-items': alignMap[props.align],
    '--c-cell-icon-size': toCssSize(props.iconSize),
  }
})
</script>
<style lang="scss">
.c-cell-card {
  .np-cell {
    --np-cell-padding-x: 12px;
    --np-cell-padding-y: 8px;
    --np-cell-control-gap: 12px;
    --np-cell-color-hover: var(--color-hover);
    --np-cell-border-color: var(--color-border);

    .np-cell__icon {
      .n-icon {
        width: var(--c-cell-icon-size);
        height: var(--c-cell-icon-size);
      }
    }
    .np-cell__wrapper {
      @apply gap-4;
      align-items: var(--c-cell-align-items);

      .np-cell__left {
        @apply min-w-20;
        flex: 1;
      }
      .np-cell__right {
        padding-top: 2px;
      }
    }
    .np-cell__footer {
      padding-bottom: 0;
    }
  }
  .np-form {
    max-width: 440px;
  }
}
</style>
