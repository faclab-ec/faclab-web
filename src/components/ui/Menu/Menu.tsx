import classNames from 'classnames'
import { MenuContextProvider } from './context/menuContext'
import { useConfig } from '../ConfigProvider'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { Ref } from 'react'

export interface MenuProps extends CommonProps {
    'aria-label'?: string
    defaultActiveKeys?: Array<string>
    defaultExpandedKeys?: Array<string>
    menuItemHeight?: number
    onSelect?: (eventKey: string, e: MouseEvent) => void
    ref?: Ref<HTMLElement>
    sideCollapsed?: boolean
    variant?: TypeAttributes.MenuVariant
}

const Menu = (props: MenuProps) => {
    const {
        children,
        className,
        defaultActiveKeys = [],
        defaultExpandedKeys = [],
        menuItemHeight = 38,
        onSelect,
        ref,
        sideCollapsed = false,
        variant = 'light',
        ...rest
    } = props

    const menuDefaultClass = 'menu'

    const { themeColor, primaryColorLevel } = useConfig()

    const menuColor = () => {
        if (variant === 'themed') {
            return `bg-${themeColor}-${primaryColorLevel} ${menuDefaultClass}-${variant}`
        }
        return `${menuDefaultClass}-${variant}`
    }

    const menuClass = classNames(menuDefaultClass, menuColor(), className)

    return (
        <nav ref={ref} className={menuClass} {...rest}>
            <MenuContextProvider
                value={{
                    onSelect,
                    menuItemHeight,
                    variant,
                    sideCollapsed,
                    defaultExpandedKeys,
                    defaultActiveKeys,
                }}
            >
                {children}
            </MenuContextProvider>
        </nav>
    )
}

Menu.displayName = 'Menu'

export default Menu
