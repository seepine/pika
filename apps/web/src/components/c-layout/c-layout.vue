<template>
  <div class="c-layout h-full w-full">
    <w-split
      default-size="250px"
      min-size="180px"
      max-size="340px"
      :collapsed="!systemInfo.md || collapsed"
      collapse-pane="1"
      resize-trigger-class="py-4"
    >
      <template #1>
        <div class="h-full bg-[var(--color-bg-2)]">
          <slot name="menu"></slot>
        </div>
      </template>
      <template #2>
        <div
          class="c-layout-content-area h-full py-2 pr-2"
          :class="!systemInfo.md || collapsed ? 'pl-2' : ''"
        >
          <div
            class="c-layout-content-body h-full flex flex-col"
            :class="hideHeader ? '' : 'overflow-hidden'"
          >
            <template v-if="hideHeader">
              <router-view v-slot="{ Component, route: viewRoute }">
                <keep-alive :max="5">
                  <component
                    :is="Component"
                    v-if="viewRoute.meta.keepAlive"
                    :key="calcKeepAliveKey(viewRoute)"
                  />
                </keep-alive>
                <component :is="Component" v-if="!viewRoute.meta.keepAlive" />
              </router-view>
            </template>
            <template v-else>
              <c-layout-header></c-layout-header>
              <n-scrollbar class="flex-1">
                <router-view v-slot="{ Component, route: viewRoute }">
                  <keep-alive :max="5">
                    <component
                      :is="Component"
                      v-if="viewRoute.meta.keepAlive"
                      :key="calcKeepAliveKey(viewRoute)"
                    />
                  </keep-alive>
                  <component :is="Component" v-if="!viewRoute.meta.keepAlive" />
                </router-view>
              </n-scrollbar>
            </template>
          </div>
        </div>
      </template>
    </w-split>

    <n-drawer
      v-if="!systemInfo.md"
      style="--n-body-padding: 0; min-width: 220px"
      :show="drawerShow"
      width="auto"
      :auto-focus="false"
      placement="left"
      content-class="h-full bg-[var(--color-bg-2)] pr-2"
      @update:show="handleDrawerShowUpdate"
    >
      <slot name="menu"></slot>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { systemInfo } from '@/composables/system.ts'
import { useLayoutCollapsed } from '@/composables/use-layout-collapsed'
import { calcKeepAliveKey } from '@/router/util'

const route = useRoute()
const hideHeader = computed(() => route.meta.hideHeader === true)
const { collapsed, drawerShow, handleDrawerShowUpdate } = useLayoutCollapsed()
</script>

<style scoped lang="scss">
.c-layout-content-area {
  background-color: var(--color-bg-2);
  // 与 w-split 伸缩动画同步
  transition: padding var(--transition-duration) var(--transition-type);

  .c-layout-content-body {
    background-color: var(--color-bg-1);
    border-radius: 8px;
  }
}
</style>
