import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import {
    companyConfigSchema,
    type CompanyConfigFormValues,
} from '../model/schemas'
import type { CompanyConfigInput } from '../model/types'
import {
    useCompanyConfig,
    useUpdateCompanyConfig,
    useCertificates,
} from '../hooks/useInvoicing'
import CompanyInfoSection from '../components/CompanyInfoSection'
import AddressSection from '../components/AddressSection'
import SriSection from '../components/SriSection'
import CertificateSection from '../components/CertificateSection'

const emptyValues: CompanyConfigFormValues = {
    taxId: '',
    name: '',
    tradeName: '',
    mainAddress: '',
    branchAddress: '',
    branchCode: '',
    salePointCode: '',
    specialTaxpayerResolution: '',
    withholdingAgentResolution: '',
    accountingRequired: false,
    environment: 1,
    emissionType: 1,
    invoiceSequence: undefined,
    signingCertId: undefined,
}

const CompanyConfigPage = () => {
    const { data: config, isLoading } = useCompanyConfig()
    const { data: certificates = [] } = useCertificates()
    const updateConfig = useUpdateCompanyConfig()

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CompanyConfigFormValues>({
        resolver: zodResolver(companyConfigSchema),
        defaultValues: emptyValues,
    })

    useEffect(() => {
        if (config) {
            reset({
                taxId: config.taxId,
                name: config.name,
                tradeName: config.tradeName,
                mainAddress: config.mainAddress,
                branchAddress: config.branchAddress,
                branchCode: config.branchCode,
                salePointCode: config.salePointCode,
                specialTaxpayerResolution:
                    config.specialTaxpayerResolution ?? '',
                withholdingAgentResolution:
                    config.withholdingAgentResolution ?? '',
                accountingRequired: config.accountingRequired,
                environment: config.environment,
                emissionType: 1,
                invoiceSequence: config.invoiceSequence ?? undefined,
                signingCertId: config.signingCertId ?? null,
            })
        }
    }, [config, reset])

    const onSubmit = async (values: CompanyConfigFormValues) => {
        try {
            const payload: CompanyConfigInput = {
                ...values,
                emissionType: 1,
                invoiceSequence: values.invoiceSequence ?? undefined,
                signingCertId: values.signingCertId || undefined,
                specialTaxpayerResolution:
                    values.specialTaxpayerResolution || undefined,
                withholdingAgentResolution:
                    values.withholdingAgentResolution || undefined,
            }
            await updateConfig.mutateAsync(payload)
            notifySuccess(
                'Configuración guardada',
                'La configuración fiscal se guardó correctamente'
            )
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar la configuración')
        }
    }

    if (isLoading) {
        return (
            <Card>
                <div className="p-4 text-center text-gray-500">
                    Cargando configuración...
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <div className="p-4">
                <div className="mb-6">
                    <h4 className="text-lg font-semibold">
                        Configuración Fiscal
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                        Datos fiscales de la empresa para la generación de
                        facturas electrónicas
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-6">
                        <CompanyInfoSection
                            register={register}
                            errors={errors}
                            isSubmitting={isSubmitting}
                        />
                        <AddressSection
                            register={register}
                            errors={errors}
                            isSubmitting={isSubmitting}
                        />
                        <SriSection
                            register={register}
                            errors={errors}
                            control={control}
                            isSubmitting={isSubmitting}
                        />
                        <CertificateSection
                            errors={errors}
                            control={control}
                            isSubmitting={isSubmitting}
                            certificates={certificates}
                        />
                    </div>

                    <div className="flex justify-end mt-8">
                        <Button
                            type="submit"
                            variant="solid"
                            loading={updateConfig.isPending}
                        >
                            Guardar Configuración
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    )
}

export default CompanyConfigPage
