import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
import type { CompanyConfigFormValues } from '../model/schemas'

const environmentOptions: { value: 1 | 2; label: string }[] = [
    { value: 1, label: '1 - Pruebas (Testing)' },
    { value: 2, label: '2 - Producción' },
]

interface SriSectionProps {
    register: UseFormRegister<CompanyConfigFormValues>
    errors: FieldErrors<CompanyConfigFormValues>
    control: Control<CompanyConfigFormValues>
    isSubmitting: boolean
}

const SriSection = ({
    register,
    errors,
    control,
    isSubmitting,
}: SriSectionProps) => {
    const numberRegister = makeNumberRegister(register)

    return (
        <section>
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Configuración SRI
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormItem
                    asterisk
                    label="Código Establecimiento"
                    invalid={!!errors.branchCode}
                    errorMessage={errors.branchCode?.message}
                >
                    <Input
                        placeholder="001"
                        maxLength={3}
                        disabled={isSubmitting}
                        invalid={!!errors.branchCode}
                        {...register('branchCode')}
                    />
                </FormItem>
                <FormItem
                    asterisk
                    label="Punto de Emisión"
                    invalid={!!errors.salePointCode}
                    errorMessage={errors.salePointCode?.message}
                >
                    <Input
                        placeholder="001"
                        maxLength={3}
                        disabled={isSubmitting}
                        invalid={!!errors.salePointCode}
                        {...register('salePointCode')}
                    />
                </FormItem>
                <FormItem
                    asterisk
                    label="Ambiente"
                    invalid={!!errors.environment}
                    errorMessage={errors.environment?.message}
                >
                    <ControlledSelect
                        name="environment"
                        control={control}
                        options={environmentOptions}
                        isDisabled={isSubmitting}
                        placeholder="Seleccione el ambiente"
                    />
                </FormItem>
                <FormItem
                    label="Secuencia de Factura"
                    invalid={!!errors.invoiceSequence}
                    errorMessage={errors.invoiceSequence?.message}
                >
                    <Input
                        type="number"
                        placeholder="1"
                        disabled={isSubmitting}
                        invalid={!!errors.invoiceSequence}
                        {...numberRegister('invoiceSequence', {
                            integer: true,
                        })}
                    />
                </FormItem>
                <FormItem
                    label="Resolución Contrib. Especial"
                    invalid={!!errors.specialTaxpayerResolution}
                    errorMessage={errors.specialTaxpayerResolution?.message}
                >
                    <Input
                        placeholder="Opcional"
                        disabled={isSubmitting}
                        invalid={!!errors.specialTaxpayerResolution}
                        {...register('specialTaxpayerResolution')}
                    />
                </FormItem>
                <FormItem
                    label="Resolución Agente Retención"
                    invalid={!!errors.withholdingAgentResolution}
                    errorMessage={errors.withholdingAgentResolution?.message}
                >
                    <Input
                        placeholder="Opcional"
                        disabled={isSubmitting}
                        invalid={!!errors.withholdingAgentResolution}
                        {...register('withholdingAgentResolution')}
                    />
                </FormItem>
                <div className="flex items-center gap-3 pt-6">
                    <ControlledSwitcher
                        name="accountingRequired"
                        control={control}
                    />
                    <span className="text-sm font-medium">
                        Obligado a llevar contabilidad
                    </span>
                </div>
            </div>
        </section>
    )
}

export default SriSection
