import { Link } from 'react-router-dom'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import type { CompanyConfigFormValues } from '../model/schemas'

interface AddressSectionProps {
    register: UseFormRegister<CompanyConfigFormValues>
    errors: FieldErrors<CompanyConfigFormValues>
    isSubmitting: boolean
}

const AddressSection = ({
    register,
    errors,
    isSubmitting,
}: AddressSectionProps) => (
    <section>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Dirección
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem
                asterisk
                label="Dirección matriz"
                invalid={!!errors.mainAddress}
                errorMessage={errors.mainAddress?.message}
            >
                <Input
                    placeholder="Av. Principal 123, Quito"
                    disabled={isSubmitting}
                    invalid={!!errors.mainAddress}
                    {...register('mainAddress')}
                />
            </FormItem>
            <p className="text-sm text-gray-500 dark:text-gray-400 md:pt-8">
                La dirección de cada establecimiento se edita en{' '}
                <Link
                    className="text-primary-600 hover:underline dark:text-primary-400"
                    to="/settings/branches"
                >
                    Sucursales
                </Link>
                : va en las facturas que emite.
            </p>
        </div>
    </section>
)

export default AddressSection
