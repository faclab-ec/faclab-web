import type { Control, FieldErrors } from 'react-hook-form'
import { FormItem } from '@/components/ui/Form'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import type { CompanyConfigFormValues } from '../model/schemas'
import type { Certificate } from '../model/types'

type CertOption = { value: string | null | undefined; label: string }

interface CertificateSectionProps {
    errors: FieldErrors<CompanyConfigFormValues>
    control: Control<CompanyConfigFormValues>
    isSubmitting: boolean
    certificates: Certificate[]
}

const CertificateSection = ({
    errors,
    control,
    isSubmitting,
    certificates,
}: CertificateSectionProps) => {
    const certOptions: CertOption[] = [
        { value: null, label: '— Sin certificado —' },
        ...certificates.map((cert) => ({
            value: cert.id,
            label: `${cert.fileName} (${new Date(
                cert.validTo
            ).toLocaleDateString('es-EC')})`,
        })),
    ]

    return (
        <section>
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Certificado de Firma
            </h5>
            <div className="max-w-md">
                <FormItem
                    label="Certificado Digital (.p12)"
                    invalid={!!errors.signingCertId}
                    errorMessage={errors.signingCertId?.message}
                >
                    <ControlledSelect<
                        CompanyConfigFormValues,
                        'signingCertId',
                        CertOption
                    >
                        name="signingCertId"
                        control={control}
                        options={certOptions}
                        isDisabled={isSubmitting}
                        placeholder="— Sin certificado —"
                    />
                </FormItem>
                {certificates.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                        No hay certificados disponibles. Sube uno en la sección
                        de Certificados Digitales.
                    </p>
                )}
            </div>
        </section>
    )
}

export default CertificateSection
