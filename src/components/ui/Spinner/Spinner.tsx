import classNames from 'classnames'
import { useConfig } from '../ConfigProvider'
import { CgSpinner } from 'react-icons/cg'
import type { CommonProps } from '../@types/common'
import type { ElementType, Ref } from 'react'

export interface SpinnerProps extends CommonProps {
    color?: string
    enableTheme?: boolean
    indicator?: ElementType
    isSpining?: boolean
    ref?: Ref<HTMLElement>
    size?: string | number
}

const Spinner = (props: SpinnerProps) => {
    const {
        className,
        color,
        enableTheme = true,
        indicator: Component = CgSpinner,
        isSpining = true,
        ref,
        size = 20,
        style,
        ...rest
    } = props

    const { themeColor, primaryColorLevel } = useConfig()

    const spinnerColor =
        color || (enableTheme && `${themeColor}-${primaryColorLevel}`)

    const spinnerStyle = {
        height: size,
        width: size,
        ...style,
    }

    const spinnerClass = classNames(
        isSpining && 'animate-spin',
        spinnerColor && `text-${spinnerColor}`,
        className
    )

    return (
        <Component
            ref={ref}
            role="status"
            aria-label="Cargando"
            style={spinnerStyle}
            className={spinnerClass}
            {...rest}
        />
    )
}

Spinner.displayName = 'Spinner'

export default Spinner
