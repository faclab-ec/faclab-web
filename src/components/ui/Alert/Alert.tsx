import { useState } from 'react'
import classNames from 'classnames'
import useTimeout from '../hooks/useTimeout'
import {
    HiCheckCircle,
    HiInformationCircle,
    HiExclamation,
    HiXCircle,
} from 'react-icons/hi'
import { motion } from 'framer-motion'
import CloseButton from '../CloseButton'
import StatusIcon from '../StatusIcon'
import type { TypeAttributes, CommonProps } from '../@types/common'
import type { ReactNode, MouseEvent, Ref } from 'react'

export interface AlertProps extends CommonProps {
    closable?: boolean
    customClose?: ReactNode | string
    customIcon?: ReactNode | string
    duration?: number
    title?: ReactNode | string
    onClose?: (e?: MouseEvent<HTMLDivElement>) => void
    ref?: Ref<HTMLDivElement>
    rounded?: boolean
    showIcon?: boolean
    triggerByToast?: boolean
    type?: TypeAttributes.Status
}

const DEFAULT_TYPE = 'warning'

const TYPE_MAP = {
    success: {
        backgroundColor:
            'bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30',
        titleColor: 'text-emerald-900 dark:text-emerald-100',
        textColor: 'text-emerald-800 dark:text-emerald-200',
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        icon: <HiCheckCircle />,
    },
    info: {
        backgroundColor:
            'bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30',
        titleColor: 'text-blue-900 dark:text-blue-100',
        textColor: 'text-blue-800 dark:text-blue-200',
        iconColor: 'text-blue-500 dark:text-blue-400',
        icon: <HiInformationCircle />,
    },
    warning: {
        backgroundColor:
            'bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30',
        titleColor: 'text-amber-900 dark:text-amber-100',
        textColor: 'text-amber-800 dark:text-amber-200',
        iconColor: 'text-amber-500 dark:text-amber-400',
        icon: <HiExclamation />,
    },
    danger: {
        backgroundColor:
            'bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30',
        titleColor: 'text-red-900 dark:text-red-100',
        textColor: 'text-red-800 dark:text-red-200',
        iconColor: 'text-red-500 dark:text-red-400',
        icon: <HiXCircle />,
    },
}

const TYPE_ARRAY: TypeAttributes.Status[] = [
    'success',
    'danger',
    'info',
    'warning',
]

const Alert = (props: AlertProps) => {
    const {
        children,
        className,
        closable = false,
        customClose,
        customIcon,
        duration = 3000,
        title = null,
        onClose,
        ref,
        rounded = true,
        showIcon = false,
        triggerByToast = false,
        ...rest
    } = props

    const getType = () => {
        const { type = DEFAULT_TYPE } = props
        if (TYPE_ARRAY.includes(type)) {
            return type
        }
        return DEFAULT_TYPE
    }

    const type = getType()
    const typeMap = TYPE_MAP[type]

    const [display, setDisplay] = useState('show')

    const { clear } = useTimeout(
        onClose as () => void,
        duration,
        (duration as number) > 0
    )

    const handleClose = (e: MouseEvent<HTMLDivElement>) => {
        setDisplay('hiding')
        onClose?.(e)
        clear()
        if (!triggerByToast) {
            setTimeout(() => {
                setDisplay('hide')
            }, 400)
        }
    }

    const renderClose = () => {
        return (
            <div
                className="cursor-pointer"
                role="presentation"
                onClick={(e) => handleClose(e)}
            >
                {customClose || <CloseButton defaultStyle={false} />}
            </div>
        )
    }

    const alertDefaultClass = 'p-4 relative flex'

    const alertClass = classNames(
        'alert',
        alertDefaultClass,
        typeMap.backgroundColor,
        typeMap.textColor,
        !title ? 'font-medium' : '',
        closable ? 'justify-between' : '',
        closable && !title ? 'items-center' : '',
        rounded && 'rounded-lg',
        className
    )

    if (display === 'hide') {
        return null
    }

    return (
        <motion.div
            ref={ref}
            // Errores y avisos interrumpen; el resto se anuncia sin urgencia
            role={type === 'danger' || type === 'warning' ? 'alert' : 'status'}
            className={alertClass}
            initial={{ opacity: 1 }}
            animate={display === 'hiding' ? 'exit' : 'animate'}
            transition={{ duration: 0.25, type: 'tween' }}
            variants={{
                animate: {
                    opacity: 1,
                },
                exit: {
                    opacity: 0,
                },
            }}
            {...rest}
        >
            <div className={`flex ${title ? '' : 'items-center'}`}>
                {showIcon && (
                    <StatusIcon
                        iconColor={typeMap.iconColor}
                        custom={customIcon}
                        type={type}
                    />
                )}
                <div className={showIcon ? 'ltr:ml-2 rtl:mr-2' : ''}>
                    {title ? (
                        <div
                            className={`font-semibold mb-1 ${typeMap.titleColor}`}
                        >
                            {title}
                        </div>
                    ) : null}
                    {children}
                </div>
            </div>
            {closable ? renderClose() : null}
        </motion.div>
    )
}

Alert.displayName = 'Alert'

export default Alert
