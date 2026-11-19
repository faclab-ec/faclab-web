import Checkbox from '@/components/ui/Checkbox'
import type { ReactNode } from 'react'

export interface CheckboxOption<T extends string | number> {
    value: T
    label: ReactNode
    hint?: ReactNode
    disabled?: boolean
}

interface CheckboxListProps<T extends string | number> {
    legend: string
    options: CheckboxOption<T>[]
    value: T[]
    disabled?: boolean
    onChange: (value: T[]) => void
}

/** Varias opciones marcables con una leyenda (scopes, eventos, sucursales). */
const CheckboxList = <T extends string | number>({
    legend,
    options,
    value,
    disabled = false,
    onChange,
}: CheckboxListProps<T>) => (
    <fieldset disabled={disabled}>
        <legend className="sr-only">{legend}</legend>
        <Checkbox.Group
            vertical
            className="w-full"
            value={value}
            onChange={(next) => onChange(next as T[])}
        >
            {options.map((option) => (
                <Checkbox
                    key={option.value}
                    value={option.value}
                    disabled={disabled || option.disabled}
                >
                    <span>{option.label}</span>
                    {option.hint && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {option.hint}
                        </span>
                    )}
                </Checkbox>
            ))}
        </Checkbox.Group>
    </fieldset>
)

export default CheckboxList
