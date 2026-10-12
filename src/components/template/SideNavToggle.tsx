import { HiOutlineMenuAlt2, HiOutlineMenu } from 'react-icons/hi'
import { useThemeStore } from '@/stores'
import useResponsive from '@/utils/hooks/useResponsive'

const SideNavToggle = () => {
    const sideNavCollapse = useThemeStore((state) => state.sideNavCollapse)
    const setSideNavCollapse = useThemeStore(
        (state) => state.setSideNavCollapse
    )

    const { larger } = useResponsive()

    if (!larger.md) {
        return null
    }

    return (
        <button
            type="button"
            className="header-action-item"
            aria-label={sideNavCollapse ? 'Expandir menú' : 'Contraer menú'}
            aria-expanded={!sideNavCollapse}
            onClick={() => setSideNavCollapse(!sideNavCollapse)}
        >
            {sideNavCollapse ? <HiOutlineMenu /> : <HiOutlineMenuAlt2 />}
        </button>
    )
}

export default SideNavToggle
