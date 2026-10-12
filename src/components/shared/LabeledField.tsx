import { useId } from 'react'
import { FormItemContextProvider } from '@/components/ui/Form/context'
import type { ReactNode } from 'react'

interface LabeledFieldProps {
    label: string
    children: ReactNode
    className?: string
}

/**
 * Un control con su etiqueta, fuera de un formulario de react-hook-form
 * (filtros de lista, diálogos simples). La etiqueta queda asociada al control
 * igual que en `FormItem`.
 */
const LabeledField = ({ label, children, className }: LabeledFieldProps) => {
    const controlId = useId()

    return (
        <div className={className}>
            <label htmlFor={controlId} className="form-label mb-1.5">
                {label}
            </label>
            <FormItemContextProvider
                value={{
                    controlId,
                    errorId: `${controlId}-error`,
                    invalid: false,
                    required: false,
                }}
            >
                {children}
            </FormItemContextProvider>
        </div>
    )
}

export default LabeledField
