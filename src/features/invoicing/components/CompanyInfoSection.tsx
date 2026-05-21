import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import type { CompanyConfigFormValues } from '../model/schemas'

interface CompanyInfoSectionProps {
    register: UseFormRegister<CompanyConfigFormValues>
    errors: FieldErrors<CompanyConfigFormValues>
    isSubmitting: boolean
}

const CompanyInfoSection = ({
    register,
    errors,
    isSubmitting,
}: CompanyInfoSectionProps) => (
    <section>
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Datos de la Empresa
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem
                asterisk
                label="RUC"
                invalid={!!errors.taxId}
                errorMessage={errors.taxId?.message}
            >
                <Input
                    placeholder="1792141001001"
                    maxLength={13}
                    disabled={isSubmitting}
                    invalid={!!errors.taxId}
                    {...register('taxId')}
                />
            </FormItem>
            <FormItem
                asterisk
                label="Razón Social"
                invalid={!!errors.name}
                errorMessage={errors.name?.message}
            >
                <Input
                    placeholder="ACME SOLUTIONS S.A."
                    disabled={isSubmitting}
                    invalid={!!errors.name}
                    {...register('name')}
                />
            </FormItem>
            <FormItem
                asterisk
                label="Nombre Comercial"
                invalid={!!errors.tradeName}
                errorMessage={errors.tradeName?.message}
            >
                <Input
                    placeholder="ACME"
                    disabled={isSubmitting}
                    invalid={!!errors.tradeName}
                    {...register('tradeName')}
                />
            </FormItem>
        </div>
    </section>
)

export default CompanyInfoSection
