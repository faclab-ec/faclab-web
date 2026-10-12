import Tooltip from '@/components/ui/Tooltip'
import Menu from '@/components/ui/Menu'
import AuthorityCheck from '@/components/shared/AuthorityCheck'
import VerticalMenuIcon from './VerticalMenuIcon'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Direction } from '@/@types/theme'
import type { NavigationTree } from '@/@types/navigation'

const { MenuItem } = Menu

interface VerticalSingleMenuItemProps {
    nav: NavigationTree
    /** La página abierta es la de este ítem */
    isCurrent?: boolean
    onLinkClick?: (link: { key: string; title: string; path: string }) => void
    sideCollapsed?: boolean
    userAuthority: string[]
    direction?: Direction
}

const VerticalSingleMenuItem = ({
    nav,
    isCurrent = false,
    onLinkClick,
    sideCollapsed,
    userAuthority,
    direction,
}: VerticalSingleMenuItemProps) => {
    const { t } = useTranslation()
    const label = t(nav.translateKey, nav.title)

    const item = (
        <MenuItem
            asElement="li"
            eventKey={nav.key}
            className={sideCollapsed ? 'mb-1 justify-center px-0' : 'mb-1'}
        >
            <Link
                to={nav.path}
                className={
                    sideCollapsed
                        ? 'flex h-full w-full items-center justify-center'
                        : 'flex h-full w-full items-center'
                }
                target={nav.isExternalLink ? '_blank' : undefined}
                aria-current={isCurrent ? 'page' : undefined}
                // Colapsado solo queda el ícono: el nombre va en la etiqueta
                aria-label={sideCollapsed ? label : undefined}
                onClick={() =>
                    onLinkClick?.({
                        key: nav.key,
                        title: nav.title,
                        path: nav.path,
                    })
                }
            >
                <VerticalMenuIcon icon={nav.icon} gutter={!sideCollapsed} />
                {!sideCollapsed && <span className="truncate">{label}</span>}
            </Link>
        </MenuItem>
    )

    return (
        <AuthorityCheck userAuthority={userAuthority} authority={nav.authority}>
            {sideCollapsed ? (
                <Tooltip
                    title={label}
                    placement={direction === 'rtl' ? 'left' : 'right'}
                >
                    {item}
                </Tooltip>
            ) : (
                item
            )}
        </AuthorityCheck>
    )
}

export default VerticalSingleMenuItem
