import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import { FormContainer, FormItem } from '@/components/ui/Form'
import { ControlledSwitcher } from '@/components/ui/Form/controlled'
import { branchSchema, type BranchFormValues } from '../model/schemas'
import type { BranchInput } from '../api/client'
import type { Branch } from '../model/types'

interface BranchFormProps {
    formId: string
    branch: Branch | null
    isSubmitting?: boolean
    onSubmit: (data: BranchInput) => void
}

const BranchForm = ({
    formId,
    branch,
    isSubmitting = false,
    onSubmit,
}: BranchFormProps) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<BranchFormValues>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            establishmentCode: branch?.establishmentCode ?? '',
            name: branch?.name ?? '',
            address: branch?.address ?? '',
            isActive: branch?.isActive ?? true,
        },
    })

    return (
        <form
            id={formId}
            onSubmit={handleSubmit((values) =>
                onSubmit({ ...values, address: values.address || null })
            )}
        >
            <FormContainer>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[10rem_1fr]">
                    <FormItem
                        asterisk
                        htmlFor="branch-establishmentCode"
                        label="Establecimiento"
                        invalid={!!errors.establishmentCode}
                        errorMessage={errors.establishmentCode?.message}
                    >
                        <Input
                            id="branch-establishmentCode"
                            placeholder="001"
                            inputMode="numeric"
                            maxLength={3}
                            disabled={isSubmitting}
                            invalid={!!errors.establishmentCode}
                            {...register('establishmentCode')}
                        />
                    </FormItem>
                    <FormItem
                        asterisk
                        htmlFor="branch-name"
                        label="Nombre"
                        invalid={!!errors.name}
                        errorMessage={errors.name?.message}
                    >
                        <Input
                            id="branch-name"
                            placeholder="Ej: Sucursal Norte"
                            disabled={isSubmitting}
                            invalid={!!errors.name}
                            {...register('name')}
                        />
                    </FormItem>
                </div>
                <FormItem
                    htmlFor="branch-address"
                    label="Dirección del establecimiento"
                    invalid={!!errors.address}
                    errorMessage={errors.address?.message}
                >
                    <Input
                        id="branch-address"
                        placeholder="Va en las facturas emitidas desde esta sucursal"
                        disabled={isSubmitting}
                        invalid={!!errors.address}
                        {...register('address')}
                    />
                </FormItem>
                <FormItem htmlFor="branch-isActive" label="Activa">
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

export default BranchForm
