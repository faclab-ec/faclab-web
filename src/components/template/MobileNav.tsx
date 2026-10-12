import { useState } from 'react'
import { HiOutlineMenuAlt2 } from 'react-icons/hi'
import Drawer from '@/components/ui/Drawer'
import Logo from '@/components/template/Logo'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import navigationConfig from '@/configs/navigation.config'
import useResponsive from '@/utils/hooks/useResponsive'
import { useSession, useBaseStore } from '@/stores'

/** Navegación principal en pantallas pequeñas: un panel que se abre a demanda. */
const MobileNav = () => {
    const [isOpen, setIsOpen] = useState(false)

    const currentRouteKey = useBaseStore((state) => state.currentRouteKey)
    const userAuthority = useSession()?.permissions ?? []

    const { smaller } = useResponsive()

    if (!smaller.md) {
        return null
    }

    const close = () => setIsOpen(false)

    return (
        <>
            <button
                type="button"
                className="header-action-item"
                aria-label="Abrir menú"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(true)}
            >
                <HiOutlineMenuAlt2 />
            </button>
            <Drawer
                title={<Logo mode="dark" size={28} />}
                contentLabel="Menú"
                isOpen={isOpen}
                portalClassName="drawer-nav"
                bodyClass="p-0"
                width={288}
                placement="left"
                onClose={close}
                onRequestClose={close}
            >
                {isOpen && (
                    <VerticalMenuContent
                        navigationTree={navigationConfig}
                        routeKey={currentRouteKey}
                        userAuthority={userAuthority as string[]}
                        onMenuItemClick={close}
                    />
                )}
            </Drawer>
        </>
    )
}

export default MobileNav
