<template>
  <NAvatar
    v-if="url"
    :src="url"
    :size="merged.size"
    :round="merged.round"
    :lazy="merged.lazy"
    object-fit="cover"
    :style="`min-width:${merged.size}px`"
  />
  <NAvatar
    v-else
    :size="merged.size"
    :round="merged.round"
    :color="bgColor"
    :style="`min-width:${merged.size}px;font-size:${fontSizePx}px`"
  >
    {{ compText }}
  </NAvatar>
</template>

<script setup lang="ts">
import { NAvatar } from 'naive-ui'
import { computed } from 'vue'
import { useMergedProps } from '../../use-merged-props'
import { WAvatarDefaults, type WAvatarProps } from './prop'

// 预设背景色，未指定 color 时按 text/url 派生稳定索引
const RANDOM_COLORS = [
  '#3498db',
  '#9b59b6',
  '#1abc9c',
  '#2ecc71',
  '#34495e',
  '#16a085',
  '#2980b9',
  '#8e44ad',
  '#e67e22',
  '#e74c3c',
] as const

// Boolean 类型 prop 显式声明 undefined，否则未传时会被 Vue 置为 false，覆盖 provider
const defaultProps = withDefaults(defineProps<WAvatarProps>(), {
  round: undefined,
  lazy: undefined,
})

const merged = useMergedProps<WAvatarProps>('Avatar', WAvatarDefaults, defaultProps)

const url = computed<string | undefined>(() => {
  const src = merged.value.src
  if (!src) return undefined
  // 绝对 URL 直接使用，相对路径拼接 baseUrl 前缀
  if (/^https?:\/\//i.test(src)) return src
  const base = merged.value.baseUrl
  return base ? `${base}${src}` : src
})

// 根据 text/textMaxChars/textCase 计算需要展示的字符
const compText = computed<string>(() => {
  const t = merged.value.text
  if (!t) {
    return ''
  }
  const sliced = t.slice(0, merged.value.textMaxChars)
  const cs = merged.value.textCase
  if (cs === 'lower') return sliced.toLowerCase()
  if (cs === 'default') return sliced
  return sliced.toUpperCase()
})

// 未指定 color 时按 text/url 哈希派生稳定颜色
const bgColor = computed<string | undefined>(() => {
  const c = merged.value.color
  if (c) return c
  const seed = compText.value || url.value
  if (!seed) return undefined
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return RANDOM_COLORS[(hash >>> 0) % RANDOM_COLORS.length]!
})

const fontSizePx = computed(() => {
  const f = merged.value.fontSize
  if (f) return f
  const s = merged.value.size
  if (s === 'small') return 12
  if (s === 'medium') return 16
  if (s === 'large') return 20
  if (typeof s === 'number') return (s * 2) / 5
  return 16
})
</script>
