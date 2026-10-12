import { Controller } from 'react-hook-form'
import Select from '@/components/ui/Select'
import type { Control, FieldValues, Path, PathValue } from 'react-hook-form'
import type { GroupBase } from 'react-select'
import type { SelectProps } from '@/components/ui/Select/Select'

interface OptionLike<V> {
    value: V
    label: string
}

type Props<
    TFieldValues extends FieldValues,
    TName extends Path<TFieldValues>,
    Option extends OptionLike<PathValue<TFieldValues, TName>>
> = Omit<
    SelectProps<Option, false, GroupBase<Option>>,
    'value' | 'onChange' | 'onBlur' | 'name' | 'options'
> & {
    name: TName
    control: Control<TFieldValues>
    options: ReadonlyArray<Option>
}

const ControlledSelect = <
    TFieldValues extends FieldValues,
    TName extends Path<TFieldValues>,
    Option extends OptionLike<PathValue<TFieldValues, TName>>
>({
    name,
    control,
    options,
    ...rest
}: Props<TFieldValues, TName, Option>) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => (
            <Select<Option>
                options={options as unknown as Option[]}
                value={options.find((opt) => opt.value === field.value) ?? null}
                onChange={(option) => field.onChange(option?.value ?? null)}
                onBlur={field.onBlur}
                {...rest}
            />
        )}
    />
)

export default ControlledSelect
