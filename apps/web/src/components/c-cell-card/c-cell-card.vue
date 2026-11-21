<template>
  <div class="c-cell-card">
    <div v-if="title" class="px-2 color-text-2 text-xs select-none pb-2">{{ title }}</div>
    <n-card content-class="p-0!">
      <np-cell-group bordered :options="options"></np-cell-group>
    </n-card>
  </div>
</template>
<script setup lang="tsx">
import type { NpCellGroupOption } from 'naive-plus'

defineProps<{
  title?: string
  options: NpCellGroupOption[]
}>()
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
        @apply w-6 h-6;
      }
    }
    .np-cell__wrapper {
      @apply gap-4 items-start;

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
