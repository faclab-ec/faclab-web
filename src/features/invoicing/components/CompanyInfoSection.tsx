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
            Datos de la empresa
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem
                asterisk
                label="RUC"
                invalid={!!errors.taxId}
                errorMessage={errors.taxId?.message}
            >
                {/* El de la empresa: las ventas llegan a facturación con él */}
                <Input
                    readOnly
                    title="El RUC de la empresa; no se cambia aquí"
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
            <FormItem
                label="Correo de respuesta"
                extra={
                    <span className="text-xs text-gray-500">
                        Si un comprador responde el correo de su factura, le
                        escribe aquí
                    </span>
                }
                invalid={!!errors.email}
                errorMessage={errors.email?.message}
            >
                <Input
                    type="email"
                    placeholder="ventas@empresa.ec"
                    disabled={isSubmitting}
                    invalid={!!errors.email}
                    {...register('email')}
                />
            </FormItem>
        </div>
    </section>
)

export default CompanyInfoSection
