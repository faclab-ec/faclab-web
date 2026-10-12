import Input from '@/components/ui/Input'
import { FormItem, FormContainer } from '@/components/ui/Form'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    customerSchema,
    type CustomerFormValues,
} from '../model/customer.schema'
import type { Customer } from '../model/types'
import { TAX_TYPE_LABELS } from '../model/types'

interface CustomerFormProps {
    formId: string
    customer?: Customer | null
    isSubmitting?: boolean
    onSubmit: (data: CustomerFormValues) => void
}

const taxTypeOptions = [
    { value: 1 as const, label: TAX_TYPE_LABELS[1] },
    { value: 2 as const, label: TAX_TYPE_LABELS[2] },
    { value: 3 as const, label: TAX_TYPE_LABELS[3] },
    { value: 4 as const, label: TAX_TYPE_LABELS[4] },
]

const emptyValues: CustomerFormValues = {
    name: '',
    taxId: '',
    taxType: 2,
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    creditLimit: undefined,
    paymentTerms: undefined,
    isActive: true,
}

export const CustomerForm = ({
    formId,
    customer,
    isSubmitting = false,
    onSubmit,
}: CustomerFormProps) => {
    const defaultValues: CustomerFormValues = customer
        ? {
              name: customer.name,
              taxId: customer.taxId,
              taxType: customer.taxType,
              email: customer.email || '',
              phone: customer.phone || '',
              address: customer.address || '',
              city: customer.city || '',
              state: customer.state || '',
              country: customer.country || '',
              creditLimit: customer.creditLimit ?? undefined,
              paymentTerms: customer.paymentTerms ?? undefined,
              isActive: customer.isActive,
          }
        : emptyValues

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues,
    })

    const numberRegister = (
        name: 'creditLimit' | 'paymentTerms',
        parser: (v: string) => number
    ) =>
        register(name, {
            setValueAs: (v) =>
                v === '' || v === null || v === undefined
                    ? undefined
                    : parser(String(v)),
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
                                placeholder="Nombre del cliente"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            htmlFor="state"
                            label="Provincia/Estado"
                            invalid={!!errors.state}
                            errorMessage={errors.state?.message}
                        >
                            <Input
                                id="state"
                                placeholder="Pichincha"
                                disabled={isSubmitting}
                                invalid={!!errors.state}
                                {...register('state')}
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
                    Información Financiera
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        htmlFor="creditLimit"
                        label="Límite de Crédito"
                        invalid={!!errors.creditLimit}
                        errorMessage={errors.creditLimit?.message}
                    >
                        <Input
                            id="creditLimit"
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            disabled={isSubmitting}
                            invalid={!!errors.creditLimit}
                            {...numberRegister('creditLimit', parseFloat)}
                        />
                    </FormItem>

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
                            {...numberRegister('paymentTerms', (v) =>
                                parseInt(v, 10)
                            )}
                        />
                    </FormItem>
                </div>

                <FormItem htmlFor="isActive" label="Estado">
                    <ControlledSwitcher name="isActive" control={control} />
                </FormItem>
            </FormContainer>
        </form>
    )
}
