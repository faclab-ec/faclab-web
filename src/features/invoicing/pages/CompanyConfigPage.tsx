import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { useSession } from '@/stores'
import type { TenantSummary } from '@/@types/auth'
import { INVOICING_ERROR_MESSAGES } from '../model/errors'
import {
    companyConfigSchema,
    type CompanyConfigFormValues,
} from '../model/schemas'
import type { CompanyConfigInput } from '../model/types'
import {
    useCompanyConfig,
    useUpdateCompanyConfig,
    useCertificates,
    useInvoicingStatus,
} from '../hooks/useInvoicing'
import InvoicingChecklist from '../components/InvoicingChecklist'
import CompanyInfoSection from '../components/CompanyInfoSection'
import AddressSection from '../components/AddressSection'
import SriSection from '../components/SriSection'
import CertificateSection from '../components/CertificateSection'
import IssuerLogoSection from '../components/IssuerLogoSection'
import PageHeader from '@/components/shared/PageHeader'

/** Sin perfil todavía: se parte de los datos de la empresa de la sesión */
const valuesFromTenant = (
    tenant: TenantSummary | undefined
): CompanyConfigFormValues => ({
    taxId: tenant?.ruc ?? '',
    name: tenant?.legalName.slice(0, 64) ?? '',
    tradeName: (tenant?.tradeName || tenant?.legalName || '').slice(0, 64),
    mainAddress: '',
    specialTaxpayerResolution: '',
    withholdingAgentResolution: '',
    rimpeRegime: null,
    accountingRequired: false,
    environment: 1,
    emissionType: 1,
    signingCertId: null,
    email: '',
})

const CompanyConfigPage = () => {
    const session = useSession()
    const tenant = session?.tenant
    const { data: config, isLoading } = useCompanyConfig()
    const { data: certificates = [] } = useCertificates()
    const { data: status } = useInvoicingStatus()
    const updateConfig = useUpdateCompanyConfig()

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CompanyConfigFormValues>({
        resolver: zodResolver(companyConfigSchema),
        defaultValues: valuesFromTenant(tenant),
    })

    useEffect(() => {
        if (config) {
            reset({
                // Siempre el de la empresa: un perfil con otro RUC deja las
                // facturas esperando (ISSUER_RUC_MISMATCH)
                taxId: tenant?.ruc ?? config.taxId,
                name: config.name,
                tradeName: config.tradeName,
                mainAddress: config.mainAddress,
                specialTaxpayerResolution:
                    config.specialTaxpayerResolution ?? '',
                withholdingAgentResolution:
                    config.withholdingAgentResolution ?? '',
                rimpeRegime: config.rimpeRegime ?? null,
                accountingRequired: config.accountingRequired,
                environment: config.environment,
                emissionType: 1,
                signingCertId: config.signingCertId ?? null,
                email: config.email ?? '',
            })
        }
    }, [config, tenant, reset])

    const onSubmit = async (values: CompanyConfigFormValues) => {
        try {
            const payload: CompanyConfigInput = {
                taxId: values.taxId,
                name: values.name,
                tradeName: values.tradeName,
                mainAddress: values.mainAddress,
                environment: values.environment,
                emissionType: 1,
                accountingRequired: values.accountingRequired,
                rimpeRegime: values.rimpeRegime,
                signingCertId: values.signingCertId || null,
                specialTaxpayerResolution:
                    values.specialTaxpayerResolution || undefined,
                withholdingAgentResolution:
                    values.withholdingAgentResolution || undefined,
                email: values.email?.trim() || undefined,
            }
            await updateConfig.mutateAsync(payload)
            const waiting = status?.pendingInvoices ?? 0
            notifySuccess(
                'Perfil fiscal guardado',
                waiting > 0
                    ? `Si la facturación quedó lista, las ${waiting} facturas pendientes se emiten automáticamente`
                    : config
                    ? 'El perfil fiscal se guardó correctamente'
                    : 'Ahora sube el certificado de firma de la empresa'
            )
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar el perfil fiscal', {
                messages: INVOICING_ERROR_MESSAGES,
            })
        }
    }

    if (isLoading) {
        return (
            <Card>
                <div className="p-4 text-center text-gray-500">
                    Cargando perfil fiscal...
                </div>
            </Card>
        )
    }

    return (
        <>
            <PageHeader
                title="Perfil fiscal"
                description={
                    tenant
                        ? `Datos de ${tenant.legalName} (RUC ${tenant.ruc}) para sus facturas electrónicas`
                        : 'Datos fiscales de la empresa para sus facturas electrónicas'
                }
            />
            <Card>
                {config && tenant && config.taxId !== tenant.ruc && (
                    <Alert showIcon className="mb-6" type="warning">
                        El perfil tenía el RUC {config.taxId}. Al guardarlo se
                        usa el de la empresa, {tenant.ruc}.
                    </Alert>
                )}
                {status && (
                    <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-sm font-semibold mb-3">
                            {status.ready
                                ? 'La facturación electrónica está lista'
                                : 'Falta completar para emitir facturas'}
                        </p>
                        <InvoicingChecklist status={status} />
                    </div>
                )}

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
                            Guardar perfil
                        </Button>
                    </div>
                </form>
            </Card>
            {/* Se sube aparte del formulario, y solo con el perfil guardado */}
            {config && (
                <Card className="mt-4">
                    <IssuerLogoSection hasLogo={config.hasLogo} />
                </Card>
            )}
        </>
    )
}

export default CompanyConfigPage
