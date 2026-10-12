import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi'
import { MODE_DARK, MODE_LIGHT } from '@/constants/theme.constant'
import { useThemeStore } from '@/stores'

/** Alterna entre modo claro y oscuro; la preferencia queda guardada. */
const ThemeModeToggle = () => {
    const mode = useThemeStore((state) => state.mode)
    const setMode = useThemeStore((state) => state.setMode)

    const isDark = mode === MODE_DARK

    return (
        <button
            type="button"
            className="header-action-item"
            aria-label={
                isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            }
            onClick={() => setMode(isDark ? MODE_LIGHT : MODE_DARK)}
        >
            {isDark ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
    )
}

export default ThemeModeToggle
