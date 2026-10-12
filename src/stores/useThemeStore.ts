import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { themeConfig } from '@/configs/theme.config'
import { MODE_DARK, MODE_LIGHT } from '@/constants/theme.constant'
import type { Mode } from '@/@types/theme'

export interface ThemeState {
    // State
    mode: Mode
    sideNavCollapse: boolean

    // Actions
    setMode: (mode: Mode) => void
    setSideNavCollapse: (collapse: boolean) => void
}

type PersistedTheme = Pick<ThemeState, 'mode' | 'sideNavCollapse'>

/**
 * La versión 0 guardaba todo el tema de la plantilla (color, layout, modo de
 * navegación). La marca ahora es fija en `theme.config`, así que solo se
 * conservan las preferencias del usuario.
 */
const migrateFromTemplateTheme = (persisted: unknown): PersistedTheme => {
    const legacy = (persisted ?? {}) as {
        mode?: unknown
        sideNavCollapse?: unknown
        layout?: { sideNavCollapse?: unknown }
    }
    const collapse = legacy.sideNavCollapse ?? legacy.layout?.sideNavCollapse

    return {
        mode: legacy.mode === MODE_DARK ? MODE_DARK : MODE_LIGHT,
        sideNavCollapse:
            typeof collapse === 'boolean'
                ? collapse
                : themeConfig.sideNavCollapse,
    }
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            // Initial state
            mode: themeConfig.mode,
            sideNavCollapse: themeConfig.sideNavCollapse,

            // Actions
            setMode: (mode) => set({ mode }),

            setSideNavCollapse: (sideNavCollapse) => set({ sideNavCollapse }),
        }),
        {
            name: 'theme-storage',
            version: 1,
            partialize: ({ mode, sideNavCollapse }): PersistedTheme => ({
                mode,
                sideNavCollapse,
            }),
            migrate: migrateFromTemplateTheme,
        }
    )
)
