import classNames from 'classnames'
import { useTabs } from './context'
import useCallbackRef from '../hooks/useCallbackRef'
import { useConfig } from '../ConfigProvider'
import type { CommonProps } from '../@types/common'
import type { TabsValue } from './context'
import type { KeyboardEvent, ReactNode, Ref } from 'react'

export interface TabNavProps extends CommonProps {
    disabled?: boolean
    icon?: string | ReactNode
    ref?: Ref<HTMLDivElement>
    value: TabsValue
}

const TabNav = (props: TabNavProps) => {
    const {
        value: valueProp,
        disabled,
        className,
        icon,
        children,
        ref,
        ...rest
    } = props

    const { value, onValueChange, variant } = useTabs()
    const isSelected = valueProp === value

    const { themeColor, primaryColorLevel } = useConfig()

    const onTabNavClick = useCallbackRef(() => {
        if (!isSelected && !disabled) {
            onValueChange?.(valueProp)
        }
    })

    // Solo Enter y Espacio activan: antes cualquier tecla (también Tab)
    // cambiaba de pestaña al recorrerlas con el teclado.
    const onTabNavKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onTabNavClick()
        }
    }

    const color = `${themeColor}-${primaryColorLevel}`

    const tabNavClass = classNames(
        'tab-nav',
        `tab-nav-${variant}`,
        isSelected &&
            `tab-nav-active text-${color} dark:text-${themeColor}-300`,
        isSelected &&
            variant === 'underline' &&
            `border-${color} dark:border-${themeColor}-400`,
        isSelected &&
            variant === 'pill' &&
            `bg-${themeColor}-50 dark:bg-${themeColor}-500/20 dark:text-${themeColor}-100`,
        disabled && 'tab-nav-disabled',
        !disabled &&
            !isSelected &&
            `text-gray-600 dark:text-gray-400 hover:text-${color} dark:hover:text-${themeColor}-300`,
        className
    )

    return (
        <div
            ref={ref}
            className={tabNavClass}
            role="tab"
            aria-selected={isSelected}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            onClick={onTabNavClick}
            onKeyDown={onTabNavKeyDown}
            {...rest}
        >
            {icon && <div className="tab-nav-icon">{icon}</div>}
            {children}
        </div>
    )
}

TabNav.displayName = 'TabNav'

export default TabNav
