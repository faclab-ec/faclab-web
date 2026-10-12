import { THEME_ENUM } from '@/constants/theme.constant'
import type {
    Direction,
    Mode,
    ColorLevel,
    NavMode,
    ControlSize,
} from '@/@types/theme'

export type ThemeConfig = {
    /** Color de interacción: foco, selección, enlaces, navegación activa */
    themeColor: string
    primaryColorLevel: ColorLevel
    /** Color de la acción principal (botón sólido) y de los interruptores */
    accentColor: string
    accentColorLevel: ColorLevel
    direction: Direction
    mode: Mode
    navMode: NavMode
    controlSize: ControlSize
    cardBordered: boolean
    sideNavCollapse: boolean
}

/**
 * Tema de la aplicación. La marca es fija: el usuario solo puede cambiar el
 * modo claro/oscuro y colapsar la navegación (ver `useThemeStore`).
 */
export const themeConfig: ThemeConfig = {
    themeColor: 'blue',
    primaryColorLevel: 600,
    accentColor: 'emerald',
    // 600 y no 500: texto blanco sobre emerald-500 queda en 2.5:1
    accentColorLevel: 600,
    direction: THEME_ENUM.DIR_LTR,
    mode: THEME_ENUM.MODE_LIGHT,
    navMode: THEME_ENUM.NAV_MODE_DARK,
    controlSize: 'md',
    cardBordered: true,
    sideNavCollapse: false,
}
