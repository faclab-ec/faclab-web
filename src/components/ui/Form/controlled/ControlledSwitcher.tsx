import { Controller } from 'react-hook-form'
import Switcher from '@/components/ui/Switcher'
import { useFormItem } from '@/components/ui/Form/context'
import type { Control, FieldValues, Path } from 'react-hook-form'
import type { SwitcherProps } from '@/components/ui/Switcher/Switcher'

type Props<
    TFieldValues extends FieldValues,
    TName extends Path<TFieldValues>
> = Omit<SwitcherProps, 'checked' | 'onChange' | 'name'> & {
    name: TName
    control: Control<TFieldValues>
}

const ControlledSwitcher = <
    TFieldValues extends FieldValues,
    TName extends Path<TFieldValues>
>({
    name,
    control,
    ...rest
}: Props<TFieldValues, TName>) => {
    // Dentro de un FormItem manda su etiqueta; suelto, un
    // `<label htmlFor={name}>` basta para nombrarlo.
    const formItem = useFormItem()

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <Switcher
                    id={formItem?.controlId ?? name}
                    checked={!!field.value}
                    onChange={(checked) => field.onChange(checked)}
                    {...rest}
                />
            )}
        />
    )
}

export default ControlledSwitcher
