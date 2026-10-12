import Input from '@/components/ui/Input'
import { FormItem, FormContainer } from '@/components/ui/Form'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    supplierSchema,
    type SupplierFormValues,
} from '../model/supplier.schema'
import { TAX_TYPE_LABELS } from '../model/types'
import type { Supplier } from '../model/types'

interface SupplierFormProps {
    formId: string
    supplier?: Supplier | null
    isSubmitting?: boolean
    onSubmit: (data: SupplierFormValues) => void
}

const taxTypeOptions = [
    { value: 1 as const, label: TAX_TYPE_LABELS[1] },
    { value: 2 as const, label: TAX_TYPE_LABELS[2] },
    { value: 3 as const, label: TAX_TYPE_LABELS[3] },
    { value: 4 as const, label: TAX_TYPE_LABELS[4] },
]

const emptyValues: SupplierFormValues = {
    name: '',
    taxId: '',
    taxType: 1,
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    paymentTerms: undefined,
    leadTimeDays: undefined,
    notes: '',
    isActive: true,
}

const SupplierForm = ({
    formId,
    supplier,
    isSubmitting = false,
    onSubmit,
}: SupplierFormProps) => {
    const defaultValues: SupplierFormValues = supplier
        ? {
              name: supplier.name,
              taxId: supplier.taxId,
              taxType: supplier.taxType,
              email: supplier.email || '',
              phone: supplier.phone || '',
              address: supplier.address || '',
              city: supplier.city || '',
              country: supplier.country || '',
              paymentTerms: supplier.paymentTerms ?? undefined,
              leadTimeDays: supplier.leadTimeDays ?? undefined,
              notes: supplier.notes || '',
              isActive: supplier.isActive,
          }
        : emptyValues

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues,
    })

    const intRegister = (name: 'paymentTerms' | 'leadTimeDays') =>
        register(name, {
            setValueAs: (v) =>
                v === '' || v === null || v === undefined
                    ? undefined
                    : parseInt(String(v), 10),
        })

    return (
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
            <FormContainer>
                <h6 className="mb-3 text-sm font-semibold">
                    Información Básica
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <FormItem
                            asterisk
                            htmlFor="name"
                            label="Nombre"
                            invalid={!!errors.name}
                            errorMessage={errors.name?.message}
                        >
                            <Input
                                id="name"
                                placeholder="Nombre del proveedor"
                                disabled={isSubmitting}
                                invalid={!!errors.name}
                                {...register('name')}
                            />
                        </FormItem>
                    </div>

                    <FormItem
                        asterisk
                        htmlFor="taxId"
                        label="Identificación"
                        invalid={!!errors.taxId}
                        errorMessage={errors.taxId?.message}
                    >
                        <Input
                            id="taxId"
                            placeholder="RUC, Cédula, Pasaporte..."
                            disabled={isSubmitting}
                            invalid={!!errors.taxId}
                            {...register('taxId')}
                        />
                    </FormItem>

                    <FormItem
                        asterisk
                        htmlFor="taxType"
                        label="Tipo de identificación"
                        invalid={!!errors.taxType}
                        errorMessage={errors.taxType?.message}
                    >
                        <ControlledSelect
                            name="taxType"
                            control={control}
                            options={taxTypeOptions}
                            isDisabled={isSubmitting}
                        />
                    </FormItem>
                </div>

                <h6 className="mb-3 text-sm font-semibold">
                    Información de Contacto
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        htmlFor="email"
                        label="Email"
                        invalid={!!errors.email}
                        errorMessage={errors.email?.message}
                    >
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@ejemplo.com"
                            disabled={isSubmitting}
                            invalid={!!errors.email}
                            {...register('email')}
                        />
                    </FormItem>

                    <FormItem
                        htmlFor="phone"
                        label="Teléfono"
                        invalid={!!errors.phone}
                        errorMessage={errors.phone?.message}
                    >
                        <Input
                            id="phone"
                            placeholder="0987654321"
                            disabled={isSubmitting}
                            invalid={!!errors.phone}
                            {...register('phone')}
                        />
                    </FormItem>
                </div>

                <h6 className="mb-3 text-sm font-semibold">Dirección</h6>
                <div className="space-y-4">
                    <FormItem
                        htmlFor="address"
                        label="Dirección"
                        invalid={!!errors.address}
                        errorMessage={errors.address?.message}
                    >
                        <Input
                            id="address"
                            placeholder="Calle principal 123"
                            disabled={isSubmitting}
                            invalid={!!errors.address}
                            {...register('address')}
                        />
                    </FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem
                            htmlFor="city"
                            label="Ciudad"
                            invalid={!!errors.city}
                            errorMessage={errors.city?.message}
                        >
                            <Input
                                id="city"
                                placeholder="Quito"
                                disabled={isSubmitting}
                                invalid={!!errors.city}
                                {...register('city')}
                            />
                        </FormItem>

                        <FormItem
                            htmlFor="country"
                            label="País"
                            invalid={!!errors.country}
                            errorMessage={errors.country?.message}
                        >
                            <Input
                                id="country"
                                placeholder="Ecuador"
                                disabled={isSubmitting}
                                invalid={!!errors.country}
                                {...register('country')}
                            />
                        </FormItem>
                    </div>
                </div>

                <h6 className="mb-3 text-sm font-semibold">
                    Información Financiera y de Abastecimiento
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        htmlFor="paymentTerms"
                        label="Términos de Pago (días)"
                        invalid={!!errors.paymentTerms}
                        errorMessage={errors.paymentTerms?.message}
                    >
                        <Input
                            id="paymentTerms"
                            type="number"
                            placeholder="30"
                            min="0"
                            disabled={isSubmitting}
                            invalid={!!errors.paymentTerms}
                            {...intRegister('paymentTerms')}
                        />
                    </FormItem>

                    <FormItem
                        htmlFor="leadTimeDays"
                        label="Tiempo de Entrega (días)"
                        invalid={!!errors.leadTimeDays}
                        errorMessage={errors.leadTimeDays?.message}
                    >
                        <Input
                            id="leadTimeDays"
                            type="number"
                            placeholder="7"
                            min="0"
                            disabled={isSubmitting}
                            invalid={!!errors.leadTimeDays}
                            {...intRegister('leadTimeDays')}
                        />
                    </FormItem>
                </div>

                <FormItem
                    htmlFor="notes"
                    label="Notas"
                    invalid={!!errors.notes}
                    errorMessage={errors.notes?.message}
                >
                    <Input
                        textArea
                        id="notes"
                        placeholder="Notas adicionales sobre el proveedor..."
                        disabled={isSubmitting}
                        invalid={!!errors.notes}
                        {...register('notes')}
                    />
                </FormItem>

                <FormItem htmlFor="isActive" label="Estado">
                    <ControlledSwitcher name="isActive" control={control} />
                </FormItem>
            </FormContainer>
        </form>
    )
}

export default SupplierForm
