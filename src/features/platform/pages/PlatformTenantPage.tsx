import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import {
    ErrorState,
    PageHeader,
    StatCard,
    StatusBadge,
} from '@/components/shared'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { formatDate } from '@shared/lib/format'
import {
    useActivateTenant,
    useChangeSubscription,
    usePlans,
    useSuspendTenant,
    useTenant,
} from '../hooks/usePlatform'
import {
    PLATFORM_ERROR_MESSAGES,
    PLATFORM_SUBSCRIPTION_STATUS_LABELS,
    TENANT_STATUS_LABELS,
    TENANT_STATUS_TONES,
    type PlatformSubscriptionStatus,
} from '../model/types'

const STATUS_OPTIONS = (
    Object.keys(
        PLATFORM_SUBSCRIPTION_STATUS_LABELS
    ) as PlatformSubscriptionStatus[]
).map((value) => ({
    value,
    label: PLATFORM_SUBSCRIPTION_STATUS_LABELS[value],
}))

/** Una empresa: su plan, su uso, su facturación y lo que la plataforma puede hacerle. */
const PlatformTenantPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { data, isLoading, error, refetch } = useTenant(id)
    const { data: plans = [] } = usePlans()
    const suspend = useSuspendTenant()
    const activate = useActivateTenant()
    const change = useChangeSubscription()
    const [suspending, setSuspending] = useState(false)
    const [reason, setReason] = useState('')
    const [plan, setPlan] = useState<string | null>(null)
    const [status, setStatus] = useState<PlatformSubscriptionStatus | null>(
        null
    )

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size={32} />
            </div>
        )
    }
    if (error || !data) {
        return <ErrorState error={error} onRetry={refetch} />
    }

    const suspended = data.status === 'suspended'
    const run = async (action: () => Promise<unknown>, done: string) => {
        try {
            await action()
            notifySuccess(done)
        } catch (err) {
            notifyError(err, 'No se pudo completar la acción', {
                messages: PLATFORM_ERROR_MESSAGES,
            })
        }
    }

    return (
        <>
            <PageHeader
                title={data.tradeName || data.legalName}
                description={`RUC ${data.ruc} · ${data.legalName}`}
                badge={
                    <StatusBadge tone={TENANT_STATUS_TONES[data.status]}>
                        {TENANT_STATUS_LABELS[data.status]}
                    </StatusBadge>
                }
                actions={
                    suspended ? (
                        <Button
                            variant="solid"
                            size="sm"
                            loading={activate.isPending}
                            onClick={() =>
                                run(
                                    () => activate.mutateAsync(data.id),
                                    'Empresa reactivada'
                                )
                            }
                        >
                            Reactivar empresa
                        </Button>
                    ) : (
                        <Button
                            variant="solid"
                            color="red-600"
                            size="sm"
                            onClick={() => setSuspending(true)}
                        >
                            Suspender empresa
                        </Button>
                    )
                }
                onBack={() => navigate('/platform/tenants')}
            />

            {suspended && (
                <Alert showIcon type="danger" className="mb-4">
                    Nadie de la empresa puede ingresar mientras esté suspendida.
                </Alert>
            )}

            <h5 className="mb-3">Facturación</h5>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                <StatCard
                    label="Facturas autorizadas"
                    value={data.invoicing.authorizedInvoices}
                />
                <StatCard
                    label="Pendientes en el SRI"
                    value={data.invoicing.pendingInvoices}
                />
                <StatCard
                    label="Rechazadas"
                    value={data.invoicing.rejectedInvoices}
                />
                <StatCard
                    label="Ventas sin factura"
                    value={data.invoicing.uninvoicedSales}
                />
                <StatCard
                    label="Diferencias abiertas"
                    value={data.invoicing.openDiscrepancies}
                />
                <StatCard
                    label="Comprobantes del mes"
                    value={data.invoicing.documentsThisMonth}
                />
            </div>
            <p className="mb-6 text-sm text-gray-500">
                El certificado y el perfil fiscal los ve el administrador de la
                empresa en su asistente de puesta en marcha.
            </p>

            <h5 className="mb-3">Plan y uso</h5>
            <Card className="mb-6">
                <p className="mb-3">
                    Plan <strong>{data.subscription?.plan?.name ?? '—'}</strong>
                    {data.subscription && (
                        <>
                            {' · '}
                            {PLATFORM_SUBSCRIPTION_STATUS_LABELS[
                                data.subscription.status
                            ] ?? data.subscription.status}
                            {data.subscription.readOnly && ' (solo lectura)'}
                        </>
                    )}
                    {data.trialEndsAt && (
                        <>
                            {' '}
                            · la prueba termina el{' '}
                            {formatDate(data.trialEndsAt)}
                        </>
                    )}
                </p>
                <ul className="mb-4 divide-y divide-gray-100 dark:divide-gray-700">
                    {(data.subscription?.resources ?? []).map((usage) => (
                        <li
                            key={usage.resource}
                            className="flex justify-between py-2 text-sm"
                        >
                            <span>{usage.resource}</span>
                            <span className="tabular-nums">
                                {usage.used} de {usage.limit ?? 'sin límite'}
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="sm:w-56">
                        <label className="mb-1 block text-sm">Plan</label>
                        <Select
                            isClearable
                            size="sm"
                            placeholder="Sin cambio"
                            options={plans.map((p) => ({
                                value: p.code,
                                label: p.name,
                            }))}
                            value={
                                plan
                                    ? {
                                          value: plan,
                                          label:
                                              plans.find((p) => p.code === plan)
                                                  ?.name ?? plan,
                                      }
                                    : null
                            }
                            onChange={(option) =>
                                setPlan(option?.value ?? null)
                            }
                        />
                    </div>
                    <div className="sm:w-56">
                        <label className="mb-1 block text-sm">Estado</label>
                        <Select
                            isClearable
                            size="sm"
                            placeholder="Sin cambio"
                            options={STATUS_OPTIONS}
                            value={
                                status
                                    ? STATUS_OPTIONS.find(
                                          (o) => o.value === status
                                      )
                                    : null
                            }
                            onChange={(option) =>
                                setStatus(option?.value ?? null)
                            }
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="solid"
                        disabled={!plan && !status}
                        loading={change.isPending}
                        onClick={() =>
                            run(async () => {
                                await change.mutateAsync({
                                    id: data.id,
                                    body: {
                                        planCode: plan ?? undefined,
                                        status: status ?? undefined,
                                    },
                                })
                                setPlan(null)
                                setStatus(null)
                            }, 'Suscripción actualizada')
                        }
                    >
                        Aplicar
                    </Button>
                </div>
            </Card>

            <ConfirmDialog
                contentLabel="Suspender la empresa"
                isOpen={suspending}
                type="danger"
                title="Suspender la empresa"
                confirmText="Suspender"
                confirmButtonColor="red-600"
                onClose={() => setSuspending(false)}
                onRequestClose={() => setSuspending(false)}
                onCancel={() => setSuspending(false)}
                onConfirm={() => {
                    setSuspending(false)
                    void run(
                        () =>
                            suspend.mutateAsync({
                                id: data.id,
                                reason: reason.trim() || undefined,
                            }),
                        'Empresa suspendida'
                    )
                }}
            >
                <p className="mb-3">
                    Nadie de la empresa podrá ingresar y sus sesiones se
                    cerrarán. Queda registrado a tu nombre.
                </p>
                <Input
                    placeholder="Motivo (opcional)"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                />
            </ConfirmDialog>
        </>
    )
}

export default PlatformTenantPage
