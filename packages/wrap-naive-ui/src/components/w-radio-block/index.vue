<!-- 封装自 n-tabs：用作分段单选块，options 切换选中项 -->
<template>
  <div
    v-if="merged.options?.length"
    :class="['w-radio-block', { 'w-radio-block--disabled': merged.disabled }]"
  >
    <n-tabs
      v-model:value="value"
      :size="merged.size"
      class="w-radio-block__tabs"
      type="segment"
      animated
    >
      <n-tab-pane v-for="item in merged.options" :key="item.key" :name="item.key">
        <template #tab>{{ item.name }}</template>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts" generic="K extends string">
import { NTabs, NTabPane } from 'naive-ui'
import { computed } from 'vue'
import { useMergedProps } from '../../use-merged-props'
import { WRadioBlockDefaults, type WRadioBlockProps } from './prop'

// Boolean 类型 prop 显式声明 undefined，否则未传时会被 Vue 置为 false，覆盖 provider
const defaultProps = withDefaults(defineProps<WRadioBlockProps<K>>(), {
  disabled: undefined,
})

const merged = useMergedProps<WRadioBlockProps<K>>('RadioBlock', WRadioBlockDefaults, defaultProps)

// disabled 时屏蔽 n-tabs 的 v-model 更新，使外层无法通过点击/键盘切换
const modelValue = defineModel<K>()
const value = computed({
  get: () => modelValue.value,
  set: (v) => {
    if (!merged.value.disabled) {
      modelValue.value = v
    }
  },
})
</script>

<style lang="scss">
.w-radio-block {
  width: 100%;
  &.w-radio-block--disabled {
    pointer-events: none;
    opacity: 0.5;
  }
  .w-radio-block__tabs.n-tabs {
    .n-tabs-tab {
      padding: 4px 12px;
      min-width: 40px;
      cursor: default;
      color: var(--color-text-2);
      &:hover {
        color: var(--color-text-2) !important;
      }
    }
    .n-tabs-tab--active {
      color: var(--color-text-1) !important;
      &:hover {
        color: var(--color-text-1) !important;
      }
    }

    &.n-tabs--small-size .n-tabs-tab__label {
      font-size: 12px;
      line-height: 14px;
    }

    &.n-tabs--medium-size .n-tabs-tab__label {
      line-height: 20px;
    }

    &.n-tabs--large-size .n-tabs-tab {
      padding: 4px 16px;
    }

    // 组件仅作分段选择器，pane 只承载 tab 文案，故隐藏内容容器
    .n-tabs-pane-wrapper {
      display: none;
    }
  }
}
</style>
