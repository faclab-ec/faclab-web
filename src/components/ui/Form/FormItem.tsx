import { useId } from 'react'
import classNames from 'classnames'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, FormItemContextProvider } from './context'
import { useConfig } from '../ConfigProvider'
import { CONTROL_SIZES, LAYOUT } from '../utils/constants'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { ReactNode, Ref } from 'react'

export interface FormItemProps extends CommonProps {
    asterisk?: boolean
    errorMessage?: string
    extra?: string | ReactNode
    htmlFor?: string
    invalid?: boolean | ''
    label?: string
    labelClass?: string
    labelWidth?: string | number
    layout?: TypeAttributes.FormLayout
    ref?: Ref<HTMLDivElement>
    size?: TypeAttributes.ControlSize
}

const FormItem = (props: FormItemProps) => {
    const {
        asterisk,
        children,
        className,
        errorMessage,
        extra,
        htmlFor,
        invalid,
        label,
        labelClass,
        labelWidth,
        layout,
        ref,
        style,
        size,
    } = props

    const formContext = useForm()
    const generatedId = useId()
    const controlId = htmlFor ?? generatedId
    const errorId = `${controlId}-error`
    const { controlSize } = useConfig()

    const formItemLabelHeight = size || formContext?.size || controlSize
    const formItemLabelWidth = labelWidth || formContext?.labelWidth
    const formItemLayout = layout || formContext?.layout

    const getFormLabelLayoutClass = () => {
        switch (formItemLayout) {
            case LAYOUT.HORIZONTAL:
                return label
                    ? `h-${CONTROL_SIZES[formItemLabelHeight]} ${
                          label && 'ltr:pr-2 rtl:pl-2'
                      }`
                    : 'ltr:pr-2 rtl:pl-2'
            case LAYOUT.VERTICAL:
                return `mb-2`
            case LAYOUT.INLINE:
                return `h-${CONTROL_SIZES[formItemLabelHeight]} ${
                    label && 'ltr:pr-2 rtl:pl-2'
                }`
            default:
                break
        }
    }

    const formItemClass = classNames(
        'form-item',
        formItemLayout,
        className,
        invalid ? 'invalid' : ''
    )

    const formLabelClass = classNames(
        'form-label',
        // El asterisco se dibuja con CSS: no forma parte del texto del label
        asterisk && 'form-label-required',
        label && getFormLabelLayoutClass(),
        labelClass
    )

    const formLabelStyle = () => {
        if (formItemLayout === LAYOUT.HORIZONTAL) {
            return { ...style, ...{ minWidth: formItemLabelWidth } }
        }

        return { ...style }
    }

    const enterStyle = { opacity: 1, marginTop: 3, bottom: -21 }
    const exitStyle = { opacity: 0, marginTop: -10 }
    const initialStyle = exitStyle

    return (
        <div ref={ref} className={formItemClass}>
            <label
                htmlFor={controlId}
                className={formLabelClass}
                style={formLabelStyle()}
            >
                {label}
                {extra && <span>{extra}</span>}
                {label &&
                    (formItemLayout === LAYOUT.HORIZONTAL ||
                        formItemLayout === LAYOUT.INLINE) &&
                    ':'}
            </label>
            <div
                className={
                    formItemLayout === LAYOUT.HORIZONTAL
                        ? 'w-full flex flex-col justify-center relative'
                        : ''
                }
            >
                <FormItemContextProvider
                    value={{
                        controlId,
                        errorId,
                        invalid: !!invalid,
                        required: !!asterisk,
                    }}
                >
                    {children}
                </FormItemContextProvider>
                <AnimatePresence mode="wait">
                    {invalid && (
                        <motion.div
                            id={errorId}
                            role="alert"
                            className="form-explain"
                            initial={initialStyle}
                            animate={enterStyle}
                            exit={exitStyle}
                            transition={{ duration: 0.15, type: 'tween' }}
                        >
                            {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

FormItem.displayName = 'FormItem'

export default FormItem
