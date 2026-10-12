import classNames from 'classnames'
import { Spinner } from '../Spinner'
import { useConfig } from '../ConfigProvider'
import { useFormItem } from '../Form/context'
import useControllableState from '../hooks/useControllableState'
import type { CommonProps } from '../@types/common'
import type { ReactNode, ChangeEvent, Ref } from 'react'

export interface SwitcherProps extends CommonProps {
    id?: string
    'aria-label'?: string
    checked?: boolean
    checkedContent?: string | ReactNode
    color?: string
    defaultChecked?: boolean
    disabled?: boolean
    isLoading?: boolean
    labelRef?: Ref<HTMLLabelElement>
    name?: string
    onChange?: (checked: boolean, e: ChangeEvent<HTMLInputElement>) => void
    readOnly?: boolean
    ref?: Ref<HTMLInputElement>
    unCheckedContent?: string | ReactNode
}

const Switcher = (props: SwitcherProps) => {
    const {
        checked,
        checkedContent,
        className,
        color,
        defaultChecked,
        disabled,
        isLoading = false,
        labelRef,
        name,
        onChange,
        readOnly,
        ref,
        unCheckedContent,
        ...rest
    } = props

    const { accentColor } = useConfig()
    const formItem = useFormItem()

    const [switcherChecked, setSwitcherChecked] = useControllableState<boolean>(
        {
            prop: checked,
            defaultProp: defaultChecked ?? false,
        }
    )

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly || isLoading) return
        const nextChecked = !switcherChecked
        setSwitcherChecked(nextChecked)
        onChange?.(nextChecked, e)
    }

    const switcherColor = color || `${accentColor}-500`

    const switcherClass = classNames(
        'switcher',
        switcherChecked &&
            `switcher-checked bg-${switcherColor} dark:bg-${switcherColor}`,
        disabled && 'switcher-disabled',
        className
    )

    return (
        <label ref={labelRef} className={switcherClass}>
            <input
                ref={ref}
                id={formItem?.controlId}
                type="checkbox"
                role="switch"
                disabled={disabled}
                readOnly={readOnly}
                name={name}
                checked={switcherChecked ?? false}
                onChange={handleChange}
                {...rest}
            />
            {isLoading ? (
                <Spinner
                    className={classNames(
                        'switcher-toggle-loading',
                        switcherChecked
                            ? 'switcher-checked-loading'
                            : 'switcher-uncheck-loading'
                    )}
                />
            ) : (
                <div className="switcher-toggle" />
            )}
            <span className="switcher-content">
                {switcherChecked ? checkedContent : unCheckedContent}
            </span>
        </label>
    )
}

Switcher.displayName = 'Switcher'

export default Switcher
