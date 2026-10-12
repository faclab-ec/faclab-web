import { useState } from 'react'
import Menu from '@/components/ui/Menu'
import AuthorityCheck from '@/components/shared/AuthorityCheck'
import VerticalSingleMenuItem from './VerticalSingleMenuItem'
import VerticalCollapsedMenuItem from './VerticalCollapsedMenuItem'
import { themeConfig } from '@/configs/theme.config'
import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_COLLAPSE,
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import useMenuActive from '@/utils/hooks/useMenuActive'
import { useTranslation } from 'react-i18next'
import type { NavigationTree } from '@/@types/navigation'

export interface VerticalMenuContentProps {
    collapsed?: boolean
    routeKey: string
    navigationTree?: NavigationTree[]
    userAuthority: string[]
    onMenuItemClick?: () => void
}

const { MenuGroup } = Menu

const VerticalMenuContent = (props: VerticalMenuContentProps) => {
    const {
        collapsed,
        routeKey,
        navigationTree = [],
        userAuthority = [],
        onMenuItemClick,
    } = props

    const { navMode, direction } = themeConfig

    const { t } = useTranslation()

    const { activedRoute } = useMenuActive(navigationTree, routeKey)

    const [defaulExpandKey] = useState<string[]>(() =>
        activedRoute?.parentKey ? [activedRoute.parentKey] : []
    )

    const renderItem = (nav: NavigationTree) =>
        nav.subMenu.length > 0 ? (
            <VerticalCollapsedMenuItem
                key={nav.key}
                nav={nav}
                sideCollapsed={collapsed}
                userAuthority={userAuthority}
                direction={direction}
                onLinkClick={onMenuItemClick}
            />
        ) : (
            <VerticalSingleMenuItem
                key={nav.key}
                nav={nav}
                isCurrent={nav.key === routeKey}
                sideCollapsed={collapsed}
                userAuthority={userAuthority}
                direction={direction}
                onLinkClick={onMenuItemClick}
            />
        )

    const getNavItem = (nav: NavigationTree) => {
        if (nav.subMenu.length === 0 && nav.type === NAV_ITEM_TYPE_ITEM) {
            return <ul key={nav.key}>{renderItem(nav)}</ul>
        }

        if (nav.subMenu.length > 0 && nav.type === NAV_ITEM_TYPE_COLLAPSE) {
            return <ul key={nav.key}>{renderItem(nav)}</ul>
        }

        if (nav.type === NAV_ITEM_TYPE_TITLE && nav.subMenu.length > 0) {
            return (
                <AuthorityCheck
                    key={nav.key}
                    userAuthority={userAuthority}
                    authority={nav.authority}
                >
                    <MenuGroup label={t(nav.translateKey) || nav.title}>
                        {nav.subMenu.map(renderItem)}
                    </MenuGroup>
                </AuthorityCheck>
            )
        }

        return null
    }

    return (
        <Menu
            aria-label="Navegación principal"
            className={collapsed ? 'px-3 pb-4' : 'px-3 pb-6'}
            variant={navMode}
            sideCollapsed={collapsed}
            defaultActiveKeys={activedRoute?.key ? [activedRoute.key] : []}
            defaultExpandedKeys={defaulExpandKey}
        >
            {navigationTree.map((nav) => getNavItem(nav))}
        </Menu>
    )
}

export default VerticalMenuContent
