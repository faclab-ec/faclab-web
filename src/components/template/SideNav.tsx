import { useEffect, useRef } from 'react'
import classNames from 'classnames'
import {
    SIDE_NAV_WIDTH,
    SIDE_NAV_COLLAPSED_WIDTH,
    HEADER_HEIGHT_CLASS,
} from '@/constants/theme.constant'
import Logo from '@/components/template/Logo'
import navigationConfig from '@/configs/navigation.config'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import useResponsive from '@/utils/hooks/useResponsive'
import { useThemeStore, useSession, useBaseStore } from '@/stores'

/** Navegación principal en escritorio; en móvil la reemplaza `MobileNav`. */
const SideNav = () => {
    const currentRouteKey = useBaseStore((state) => state.currentRouteKey)
    const sideNavCollapse = useThemeStore((state) => state.sideNavCollapse)
    const userAuthority = useSession()?.permissions ?? []

    const { larger } = useResponsive()

    // El menú es más alto que la pantalla: la página abierta debe quedar a la vista
    const contentRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        contentRef.current
            ?.querySelector('[aria-current="page"]')
            ?.scrollIntoView({ block: 'nearest' })
    }, [currentRouteKey])

    if (!larger.md) {
        return null
    }

    const width = sideNavCollapse ? SIDE_NAV_COLLAPSED_WIDTH : SIDE_NAV_WIDTH

    return (
        <aside className="side-nav" style={{ width, minWidth: width }}>
            <div
                className={classNames(
                    'side-nav-header',
                    HEADER_HEIGHT_CLASS,
                    sideNavCollapse ? 'justify-center' : 'px-5'
                )}
            >
                <Logo
                    mode="dark"
                    size={30}
                    type={sideNavCollapse ? 'streamline' : 'full'}
                />
            </div>
            <div ref={contentRef} className="side-nav-content">
                <VerticalMenuContent
                    collapsed={sideNavCollapse}
                    navigationTree={navigationConfig}
                    routeKey={currentRouteKey}
                    userAuthority={userAuthority as string[]}
                />
            </div>
        </aside>
    )
}

export default SideNav
