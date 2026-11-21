<template>
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
<script setup lang="ts">
import { calcKeepAliveKey } from '@/router/util'
</script>
