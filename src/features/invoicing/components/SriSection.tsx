import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
import type { CompanyConfigFormValues } from '../model/schemas'
import {
    RIMPE_REGIMES,
    RIMPE_REGIME_LABELS,
    type RimpeRegime,
} from '../model/types'

const environmentOptions: { value: 1 | 2; label: string }[] = [
    { value: 1, label: 'Pruebas' },
    { value: 2, label: 'Producción' },
]

const rimpeOptions: { value: RimpeRegime | null; label: string }[] = [
    { value: null, label: 'No está en el RIMPE' },
    ...RIMPE_REGIMES.map((regime) => ({
        value: regime,
        label: RIMPE_REGIME_LABELS[regime],
    })),
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
    return (
        <section>
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                SRI
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormItem
                    asterisk
                    label="Ambiente del SRI"
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
                <FormItem label="Régimen RIMPE">
                    <ControlledSelect
                        name="rimpeRegime"
                        control={control}
                        options={rimpeOptions}
                        isDisabled={isSubmitting}
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
