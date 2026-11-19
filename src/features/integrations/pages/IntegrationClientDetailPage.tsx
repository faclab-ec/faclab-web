import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlinePencil, HiPlus } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Tabs from '@/components/ui/Tabs'
import {
    ConfirmDialog,
    EmptyState,
    ErrorState,
    FormModal,
} from '@/components/shared'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { isApiError } from '@/utils/errors/ApiError'
import { useBranchesList } from '@features/organization'
import {
    useIntegrationClient,
    useIntegrationClientMutations,
} from '../hooks/useIntegrations'
import {
    useWebhookEndpointMutations,
    useWebhookEndpoints,
} from '../hooks/useWebhooks'
import { INTEGRATION_ERROR_MESSAGES } from '../model/errors'
import {
    INTEGRATION_CLIENT_STATUS_LABELS,
    INTEGRATION_CLIENT_STATUS_TONES,
    INTEGRATION_ENVIRONMENT_LABELS,
    INTEGRATION_ENVIRONMENT_TONES,
    SCOPE_LABELS,
    type IntegrationClient,
} from '../model/types'
import IntegrationClientForm from '../components/IntegrationClientForm'
import ClientSecretsSection from '../components/ClientSecretsSection'
import ClientUsageSection from '../components/ClientUsageSection'
import WebhookEndpointsTable from '../components/WebhookEndpointsTable'
import WebhookEndpointCreateForm from '../components/WebhookEndpointCreateForm'
import SecretValue from '../components/SecretValue'
import type {
    IntegrationClientInput,
    WebhookEndpointInput,
} from '../api/client'

const { TabList, TabNav, TabContent } = Tabs

const FORM_ID = 'integration-client-detail-form'
const WEBHOOK_FORM_ID = 'client-webhook-form'
const CLIENTS_PATH = '/settings/integrations'

const Field = ({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) => (
    <div>
        <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1">{children}</dd>
    </div>
)

const SummarySection = ({
    client,
    branchNames,
}: {
    client: IntegrationClient
    branchNames: Map<number, string>
}) => (
    <Card>
        <div className="mb-6 max-w-xl">
            <SecretValue
                label="Client ID"
                value={client.clientId}
                copiedMessage="Client ID copiado"
            />
        </div>
        <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Permisos (scopes)">
                <ul className="flex flex-col gap-1">
                    {client.scopes.map((scope) => (
                        <li key={scope}>
                            <span className="font-mono text-sm">{scope}</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {SCOPE_LABELS[scope]}
                            </span>
                        </li>
                    ))}
                </ul>
            </Field>
            <div className="flex flex-col gap-6">
                <Field label="Sucursales">
                    {client.branchIds
                        ? client.branchIds
                              .map((id) => branchNames.get(id) ?? `#${id}`)
                              .join(', ')
                        : 'Todas'}
                </Field>
                <Field label="Redes de origen">
                    {client.allowedIps ? (
                        <span className="font-mono text-sm">
                            {client.allowedIps.join(', ')}
                        </span>
                    ) : (
                        'Cualquiera'
                    )}
                </Field>
                <Field label="Creado">{formatDatetime(client.createdAt)}</Field>
                <Field label="Último uso">
                    {client.lastUsedAt
                        ? formatDatetime(client.lastUsedAt)
                        : 'Nunca'}
                </Field>
                {client.revokedAt && (
                    <Field label="Revocado">
                        {formatDatetime(client.revokedAt)}
                    </Field>
                )}
            </div>
        </dl>
    </Card>
)

const IntegrationClientDetailPage = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const clientId = Number(id) || 0
    const [editing, setEditing] = useState(false)
    const [revoking, setRevoking] = useState(false)
    const [addingWebhook, setAddingWebhook] = useState(false)

    const client = useIntegrationClient(clientId)
    const branches = useBranchesList({ limit: 1000 })
    // Como mucho 20 por empresa: se filtran los del cliente aquí
    const endpoints = useWebhookEndpoints({ limit: 100 })
    const { update, revoke } = useIntegrationClientMutations()
    const webhooks = useWebhookEndpointMutations()

    const handleUpdate = async (values: IntegrationClientInput) => {
        try {
            await update.mutateAsync({ id: clientId, data: values })
            notifySuccess('Cliente actualizado')
            setEditing(false)
        } catch (err) {
            notifyError(err, 'No se pudo guardar el cliente', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    const handleRevoke = async () => {
        try {
            await revoke.mutateAsync(clientId)
            notifySuccess(
                'Cliente revocado',
                'Sus tokens dejan de valer en menos de un minuto y sus webhooks se desactivan'
            )
            setRevoking(false)
        } catch (err) {
            notifyError(err, 'No se pudo revocar el cliente', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    const handleAddWebhook = async (values: WebhookEndpointInput) => {
        try {
            const endpoint = await webhooks.create.mutateAsync(values)
            notifySuccess('Webhook creado')
            setAddingWebhook(false)
            navigate(`/settings/webhooks/${endpoint.id}`)
        } catch (err) {
            notifyError(err, 'No se pudo crear el webhook', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    if (client.isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Spinner size={40} />
            </div>
        )
    }

    if (!client.data) {
        return client.error &&
            !(isApiError(client.error) && client.error.code === 'NOT_FOUND') ? (
            <ErrorState error={client.error} onRetry={() => client.refetch()} />
        ) : (
            <EmptyState
                className="min-h-[24rem]"
                title="Cliente de integración no encontrado"
                action={
                    <Button
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(CLIENTS_PATH)}
                    >
                        Volver a Integraciones
                    </Button>
                }
            />
        )
    }

    const data = client.data
    const active = data.status === 'ACTIVE'
    const branchNames = new Map(
        (branches.data?.items ?? []).map((b) => [
            b.id,
            `${b.establishmentCode} · ${b.name}`,
        ])
    )
    const ownEndpoints = (endpoints.data?.items ?? []).filter(
        (e) => e.integrationClientId === data.id
    )

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                className="!mb-1"
                title={data.name}
                badge={
                    <>
                        <StatusBadge
                            tone={
                                INTEGRATION_ENVIRONMENT_TONES[data.environment]
                            }
                        >
                            {INTEGRATION_ENVIRONMENT_LABELS[data.environment]}
                        </StatusBadge>
                        <StatusBadge
                            tone={INTEGRATION_CLIENT_STATUS_TONES[data.status]}
                        >
                            {INTEGRATION_CLIENT_STATUS_LABELS[data.status]}
                        </StatusBadge>
                    </>
                }
                description="Cliente de la API pública"
                actions={
                    active && (
                        <>
                            <Button
                                size="sm"
                                icon={<HiOutlinePencil />}
                                onClick={() => setEditing(true)}
                            >
                                Editar
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                color="red-600"
                                onClick={() => setRevoking(true)}
                            >
                                Revocar cliente
                            </Button>
                        </>
                    )
                }
                onBack={() => navigate(CLIENTS_PATH)}
            />

            <Tabs defaultValue="summary" variant="underline">
                <TabList>
                    <TabNav value="summary">Resumen</TabNav>
                    <TabNav value="secrets">Secretos</TabNav>
                    <TabNav value="usage">Uso</TabNav>
                    <TabNav value="webhooks">Webhooks</TabNav>
                </TabList>
                <div className="pt-4">
                    <TabContent value="summary">
                        <SummarySection
                            client={data}
                            branchNames={branchNames}
                        />
                    </TabContent>
                    <TabContent value="secrets">
                        <ClientSecretsSection client={data} />
                    </TabContent>
                    <TabContent value="usage">
                        <ClientUsageSection clientId={data.id} />
                    </TabContent>
                    <TabContent value="webhooks">
                        <Card
                            header={
                                <h2 className="text-lg">
                                    Webhooks del cliente
                                </h2>
                            }
                            headerExtra={
                                active && (
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<HiPlus />}
                                        onClick={() => setAddingWebhook(true)}
                                    >
                                        Nuevo webhook
                                    </Button>
                                )
                            }
                            bodyClass="p-0"
                        >
                            <WebhookEndpointsTable
                                hideOwner
                                endpoints={ownEndpoints}
                                clients={[data]}
                                loading={endpoints.isLoading}
                                error={endpoints.error}
                                onRetry={() => endpoints.refetch()}
                            />
                        </Card>
                    </TabContent>
                </div>
            </Tabs>

            <FormModal
                formId={FORM_ID}
                width={640}
                isOpen={editing}
                title="Editar cliente de integración"
                isSubmitting={update.isPending}
                onClose={() => setEditing(false)}
            >
                <IntegrationClientForm
                    formId={FORM_ID}
                    client={data}
                    branches={branches.data?.items ?? []}
                    isSubmitting={update.isPending}
                    onSubmit={handleUpdate}
                />
            </FormModal>

            <FormModal
                formId={WEBHOOK_FORM_ID}
                width={640}
                isOpen={addingWebhook}
                title="Nuevo webhook"
                isSubmitting={webhooks.create.isPending}
                onClose={() => setAddingWebhook(false)}
            >
                <WebhookEndpointCreateForm
                    formId={WEBHOOK_FORM_ID}
                    clients={[data]}
                    defaultClientId={data.id}
                    isSubmitting={webhooks.create.isPending}
                    onSubmit={handleAddWebhook}
                />
            </FormModal>

            <ConfirmDialog
                isOpen={revoking}
                type="danger"
                title="Revocar cliente"
                confirmText="Revocar"
                confirmButtonColor="red-600"
                onClose={() => setRevoking(false)}
                onCancel={() => setRevoking(false)}
                onConfirm={handleRevoke}
            >
                <p>
                    <strong>{data.name}</strong> deja de poder pedir tokens y
                    los que tiene dejan de valer en menos de un minuto. Sus
                    webhooks se desactivan. No se puede deshacer: para volver a
                    integrar, crea otro cliente.
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default IntegrationClientDetailPage
