import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
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

type CertOption = { value: string | null | undefined; label: string }

const environmentOptions: { value: 1 | 2; label: string }[] = [
    { value: 1, label: '1 - Pruebas (Testing)' },
    { value: 2, label: '2 - Producción' },
]

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

    const numberRegister = makeNumberRegister(register)

    const certOptions: CertOption[] = [
        { value: null, label: '— Sin certificado —' },
        ...certificates.map((cert) => ({
            value: cert.id,
            label: `${cert.fileName} (${new Date(
                cert.validTo
            ).toLocaleDateString('es-EC')})`,
        })),
    ]

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

                        <section>
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                Dirección
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem
                                    asterisk
                                    label="Dirección Matriz"
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
                                <FormItem
                                    asterisk
                                    label="Dirección Sucursal"
                                    invalid={!!errors.branchAddress}
                                    errorMessage={errors.branchAddress?.message}
                                >
                                    <Input
                                        placeholder="Av. Secundaria 456, Quito"
                                        disabled={isSubmitting}
                                        invalid={!!errors.branchAddress}
                                        {...register('branchAddress')}
                                    />
                                </FormItem>
                            </div>
                        </section>

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
                                        maxLength={4}
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
                                        maxLength={4}
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
                                    errorMessage={
                                        errors.invoiceSequence?.message
                                    }
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
                                    errorMessage={
                                        errors.specialTaxpayerResolution
                                            ?.message
                                    }
                                >
                                    <Input
                                        placeholder="Opcional"
                                        disabled={isSubmitting}
                                        invalid={
                                            !!errors.specialTaxpayerResolution
                                        }
                                        {...register(
                                            'specialTaxpayerResolution'
                                        )}
                                    />
                                </FormItem>
                                <FormItem
                                    label="Resolución Agente Retención"
                                    invalid={
                                        !!errors.withholdingAgentResolution
                                    }
                                    errorMessage={
                                        errors.withholdingAgentResolution
                                            ?.message
                                    }
                                >
                                    <Input
                                        placeholder="Opcional"
                                        disabled={isSubmitting}
                                        invalid={
                                            !!errors.withholdingAgentResolution
                                        }
                                        {...register(
                                            'withholdingAgentResolution'
                                        )}
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
                                        No hay certificados disponibles. Sube
                                        uno en la sección de Certificados
                                        Digitales.
                                    </p>
                                )}
                            </div>
                        </section>
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
