<template>
  <div class="c-cell-card">
    <div class="px-2 color-text-2 text-xs select-none pb-2">{{ title }}</div>
    <n-card content-class="py-2!">
      <np-cell-group bordered :options="options"></np-cell-group>
    </n-card>
  </div>
</template>
<script setup lang="tsx">
import type { NpCellGroupOption } from 'naive-plus'

defineProps<{
  title: string
  options: NpCellGroupOption[]
}>()
</script>
<style lang="scss">
.c-cell-card {
  .np-cell {
    --np-cell-padding-y: 8px;
    .np-cell__icon {
      @apply pr-4;
      .n-icon {
        @apply w-6 h-6;
      }
    }
    .np-cell__wrapper {
      .np-cell__left {
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
