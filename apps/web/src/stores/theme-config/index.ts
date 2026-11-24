import {
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  lightTheme,
  zhCN,
  type ConfigProviderProps,
} from 'naive-ui'
import { defineStore } from 'pinia'
import { toMerged } from 'es-toolkit'

const sizeConfig: ConfigProviderProps = {
  themeOverrides: {
    Button: {
      borderRadiusMedium: '8px',
      borderRadiusSmall: '6px',
      fontSizeSmall: '13px',
      fontSizeTiny: '12px',
      iconSizeSmall: '16px',
    },
    Input: {
      borderRadius: '6px',
      paddingSmall: '8px',
    },
    Card: {
      borderRadius: '8px',
      paddingMedium: '16px',
    },
    Dialog: {
      padding: '16px 20px 20px 20px',
      closeMargin: '16px 16px 0 0',
    },
    Modal: {
      peers: {
        Card: {
          titleFontSizeMedium: '16px',
        },
        Dialog: {
          titleFontSize: '16px',
        },
      },
    },
    Dropdown: {
      borderRadius: '6px',
    },
    Form: {
      feedbackFontSizeMedium: '12px',
      labelFontSizeLeftMedium: '13px',
      labelFontSizeTopMedium: '13px',
    },
  },
}

export const useThemeConfigStore = defineStore('theme-config', () => {
  const themeStore = useThemeStore()
  const localeStore = useLocaleStore()

  /** 当前模式下的主题色三个色值 */
  const primaryColor = computed(
    () => primaryColorPresets[themeStore.primaryColor][themeStore.isDark ? 'dark' : 'light'],
  )

  const themeConfig = computed<ConfigProviderProps>(() => {
    const isDark = themeStore.isDark

    return toMerged(
      {
        theme: isDark ? darkTheme : lightTheme,
        themeOverrides: {
          common: {
            primaryColor: primaryColor.value.color,
            primaryColorHover: primaryColor.value.hover,
            primaryColorPressed: primaryColor.value.pressed,
            primaryColorSuppl: primaryColor.value.hover,
            textColor1Depth: 'var(--color-text-1)',
            textColor2Depth: 'var(--color-text-2)',
            textColor3Depth: 'var(--color-text-3)',
          },
          Layout: {
            color: isDark ? undefined : '#fcfcfc',
          },
          Tabs: {
            tabTextColorActiveSegment: primaryColor.value.color,
            tabTextColorHoverSegment: primaryColor.value.hover,
          },
          Button: {
            waveOpacity: 0,
          },
          Input: {
            color: isDark ? 'rgba(255, 255, 255, .08)' : 'rgba(46, 51, 56, .05)',
            border: 'rgba(0,0,0,0)',
            borderHover: 'rgba(0,0,0,0)',
            colorHover: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(46,51,56,0.09)',
          },
          InternalSelectMenu: {
            color: 'var(--color-bg-3)',
          },
          TreeSelect: {
            menuColor: 'var(--color-bg-2)',
          },
          Popover: {
            color: 'var(--color-bg-3)',
          },
          Dropdown: {
            color: isDark ? 'var(--color-bg-3)' : undefined,
          },
          Form: {
            labelTextColor: 'var(--color-text-2)',
          },
          Switch: {
            boxShadowFocus: 'unset',
          },
          Modal: {
            peers: {
              Card: {
                colorModal: 'var(--color-bg-2)',
              },
              Dialog: {
                color: 'var(--color-bg-2)',
              },
            },
          },
        },
      } as ConfigProviderProps,
      sizeConfig,
    )
  })

  const localeConfig = computed(() => {
    const isZh = localeStore.locale === 'zh'
    return {
      locale: isZh ? zhCN : enUS,
      dateLocale: isZh ? dateZhCN : dateEnUS,
    }
  })

  const configProviderProps = computed<ConfigProviderProps>(() => ({
    ...themeConfig.value,
    ...localeConfig.value,
  }))

  return {
    primaryColor,
    configProviderProps,
  }
})
