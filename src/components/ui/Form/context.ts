import { createContext, useContext } from 'react'
import type { TypeAttributes } from '../@types/common'

export type FormContextProps = {
    size?: TypeAttributes.ControlSize
    layout?: TypeAttributes.FormLayout
    labelWidth?: string | number
}

const FormContext = createContext<FormContextProps | null>(null)

export const FormContextProvider = FormContext.Provider

export const FormContextConsumer = FormContext.Consumer

export function useForm() {
    return useContext(FormContext)
}

export type FormItemContextProps = {
    /** `id` que debe llevar el control para que el `<label>` lo nombre */
    controlId: string
    /** `id` del mensaje de error, para `aria-describedby` */
    errorId: string
    invalid: boolean
    /** El `FormItem` está marcado como obligatorio (`asterisk`) */
    required: boolean
}

const FormItemContext = createContext<FormItemContextProps | null>(null)

export const FormItemContextProvider = FormItemContext.Provider

/** Datos del `FormItem` que envuelve al control, o `null` fuera de uno. */
export function useFormItem() {
    return useContext(FormItemContext)
}

export default FormContext
