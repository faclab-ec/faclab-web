import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import { FormContainer, FormItem } from '@/components/ui/Form'
import { ControlledSwitcher } from '@/components/ui/Form/controlled'
import {
    emissionPointSchema,
    type EmissionPointFormValues,
} from '../model/schemas'
import type { EmissionPointInput } from '../api/client'
import type { EmissionPoint } from '../model/types'

interface EmissionPointFormProps {
    formId: string
    emissionPoint: EmissionPoint | null
    isSubmitting?: boolean
    onSubmit: (data: EmissionPointInput) => void
}

const EmissionPointForm = ({
    formId,
    emissionPoint,
    isSubmitting = false,
    onSubmit,
}: EmissionPointFormProps) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<EmissionPointFormValues>({
        resolver: zodResolver(emissionPointSchema),
        defaultValues: {
            code: emissionPoint?.code ?? '',
            name: emissionPoint?.name ?? '',
            isActive: emissionPoint?.isActive ?? true,
        },
    })

    return (
        <form
            id={formId}
            onSubmit={handleSubmit((values) =>
                onSubmit({ ...values, name: values.name || null })
            )}
        >
            <FormContainer>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[10rem_1fr]">
                    <FormItem
                        asterisk
                        htmlFor="emissionPoint-code"
                        label="Código"
                        invalid={!!errors.code}
                        errorMessage={errors.code?.message}
                    >
                        <Input
                            id="emissionPoint-code"
                            placeholder="001"
                            inputMode="numeric"
                            maxLength={3}
                            disabled={isSubmitting}
                            invalid={!!errors.code}
                            {...register('code')}
                        />
                    </FormItem>
                    <FormItem
                        htmlFor="emissionPoint-name"
                        label="Nombre"
                        invalid={!!errors.name}
                        errorMessage={errors.name?.message}
                    >
                        <Input
                            id="emissionPoint-name"
                            placeholder="Opcional"
                            disabled={isSubmitting}
                            invalid={!!errors.name}
                            {...register('name')}
                        />
                    </FormItem>
                </div>
                <FormItem htmlFor="emissionPoint-isActive" label="Activo">
                    <ControlledSwitcher
                        name="isActive"
                        control={control}
                        disabled={isSubmitting}
                    />
                </FormItem>
            </FormContainer>
        </form>
    )
}

export default EmissionPointForm
