import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    HiOutlineArrowLeft,
    HiOutlinePaperAirplane,
    HiOutlinePencil,
    HiOutlineTrash,
} from 'react-icons/hi'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import {
    DeleteConfirmDialog,
    EmptyState,
    ErrorState,
    FormModal,
} from '@/components/shared'
import PageHeader from '@/components/shared/PageHeader'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { isApiError } from '@/utils/errors/ApiError'
import { useIntegrationClients } from '../hooks/useIntegrations'
import {
    useWebhookEndpoint,
    useWebhookEndpointMutations,
} from '../hooks/useWebhooks'
import { INTEGRATION_ERROR_MESSAGES } from '../model/errors'
import { WEBHOOK_EVENT_LABELS } from '../model/types'
import { displayUrl, ownerName } from '../lib/endpoints'
import EndpointStatusBadge from '../components/EndpointStatusBadge'
import WebhookEndpointEditForm from '../components/WebhookEndpointEditForm'
import WebhookSecretCard from '../components/WebhookSecretCard'
import WebhookDeliveriesSection from '../components/WebhookDeliveriesSection'
import type { WebhookEndpointUpdateInput } from '../api/client'

const FORM_ID = 'webhook-endpoint-edit-form'
const WEBHOOKS_PATH = '/settings/webhooks'

const WebhookEndpointDetailPage = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const endpointId = Number(id) || 0
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const endpoint = useWebhookEndpoint(endpointId)
    const clients = useIntegrationClients({ limit: 1000 })
    const mutations = useWebhookEndpointMutations()

    const run = async (
        action: () => Promise<unknown>,
        success: [string, string?],
        failure: string
    ) => {
        try {
            await action()
            notifySuccess(...success)
            return true
        } catch (err) {
            notifyError(err, failure, { messages: INTEGRATION_ERROR_MESSAGES })
            return false
        }
    }

    const handleUpdate = async (values: WebhookEndpointUpdateInput) => {
        const done = await run(
            () =>
                mutations.update.mutateAsync({ id: endpointId, data: values }),
            ['Webhook actualizado'],
            'No se pudo guardar el webhook'
        )
        if (done) setEditing(false)
    }

    const handleDelete = async () => {
        const done = await run(
            () => mutations.delete.mutateAsync(endpointId),
            ['Webhook eliminado'],
            'No se pudo eliminar el webhook'
        )
        if (done) navigate(WEBHOOKS_PATH)
    }

    if (endpoint.isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Spinner size={40} />
            </div>
        )
    }

    if (!endpoint.data) {
        return endpoint.error &&
            !(
                isApiError(endpoint.error) &&
                endpoint.error.code === 'NOT_FOUND'
            ) ? (
            <ErrorState
                error={endpoint.error}
                onRetry={() => endpoint.refetch()}
            />
        ) : (
            <EmptyState
                className="min-h-[24rem]"
                title="Webhook no encontrado"
                action={
                    <Button
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(WEBHOOKS_PATH)}
                    >
                        Volver a Webhooks
                    </Button>
                }
            />
        )
    }

    const data = endpoint.data
    const allClients = clients.data?.items ?? []
    const owner =
        allClients.find((c) => c.id === data.integrationClientId) ?? null
    const active = data.status === 'active'

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                className="!mb-1"
                title={data.description || displayUrl(data.url)}
                badge={<EndpointStatusBadge endpoint={data} />}
                description={
                    data.description ? displayUrl(data.url) : undefined
                }
                actions={
                    <>
                        <Button
                            size="sm"
                            icon={<HiOutlinePaperAirplane />}
                            disabled={!active || mutations.test.isPending}
                            onClick={() =>
                                run(
                                    () =>
                                        mutations.test.mutateAsync(endpointId),
                                    [
                                        'Prueba en cola',
                                        'Llega como webhook.test en unos segundos',
                                    ],
                                    'No se pudo enviar la prueba'
                                )
                            }
                        >
                            Probar
                        </Button>
                        {active ? (
                            <Button
                                size="sm"
                                disabled={mutations.disable.isPending}
                                onClick={() =>
                                    run(
                                        () =>
                                            mutations.disable.mutateAsync(
                                                endpointId
                                            ),
                                        [
                                            'Webhook desactivado',
                                            'Lo pendiente espera hasta que lo actives',
                                        ],
                                        'No se pudo desactivar'
                                    )
                                }
                            >
                                Desactivar
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="solid"
                                disabled={mutations.enable.isPending}
                                onClick={() =>
                                    run(
                                        () =>
                                            mutations.enable.mutateAsync(
                                                endpointId
                                            ),
                                        ['Webhook activado'],
                                        'No se pudo activar'
                                    )
                                }
                            >
                                Activar
                            </Button>
                        )}
                        <Button
                            size="sm"
                            icon={<HiOutlinePencil />}
                            onClick={() => setEditing(true)}
                        >
                            Editar
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            aria-label="Eliminar webhook"
                            icon={<HiOutlineTrash />}
                            onClick={() => setDeleting(true)}
                        />
                    </>
                }
                onBack={() => navigate(WEBHOOKS_PATH)}
            />

            {data.disabledReason === 'failing' && (
                <Alert showIcon type="danger" title="Desactivado por fallas">
                    Una entrega agotó sus intentos sin que el receptor
                    respondiera bien a ninguna. Corrige el receptor, actívalo y
                    reenvía las entregas fallidas.
                </Alert>
            )}
            {data.disabledReason === 'client_revoked' && (
                <Alert showIcon type="warning" title="Su cliente fue revocado">
                    No se puede volver a activar: crea el webhook en un cliente
                    activo.
                </Alert>
            )}

            <Card>
                <dl className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">
                            URL
                        </dt>
                        <dd className="mt-1 break-all font-mono text-sm">
                            {displayUrl(data.url)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">
                            Dueño
                        </dt>
                        <dd className="mt-1">
                            {data.integrationClientId === null ? (
                                'Empresa'
                            ) : (
                                <Link
                                    className="text-primary-600 hover:underline dark:text-primary-400"
                                    to={`/settings/integrations/${data.integrationClientId}`}
                                >
                                    {ownerName(data, allClients)}
                                </Link>
                            )}
                            {data.excludeOwnChanges &&
                                ' · sin sus propios cambios'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">
                            Última entrega
                        </dt>
                        <dd className="mt-1">
                            {data.failingSince
                                ? `Falla desde ${formatDatetime(
                                      data.failingSince
                                  )}`
                                : data.lastSuccessAt
                                ? formatDatetime(data.lastSuccessAt)
                                : 'Ninguna'}
                        </dd>
                    </div>
                    <div className="md:col-span-3">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">
                            Eventos
                        </dt>
                        <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            {data.eventTypes.map((type) => (
                                <span key={type}>
                                    {WEBHOOK_EVENT_LABELS[type]}{' '}
                                    <span className="font-mono text-xs text-gray-500">
                                        {type}
                                    </span>
                                </span>
                            ))}
                        </dd>
                    </div>
                </dl>
            </Card>

            <WebhookSecretCard endpoint={data} />
            <WebhookDeliveriesSection endpoint={data} />

            <FormModal
                formId={FORM_ID}
                width={640}
                isOpen={editing}
                title="Editar webhook"
                isSubmitting={mutations.update.isPending}
                onClose={() => setEditing(false)}
            >
                <WebhookEndpointEditForm
                    formId={FORM_ID}
                    endpoint={data}
                    owner={owner}
                    isSubmitting={mutations.update.isPending}
                    onSubmit={handleUpdate}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={deleting}
                itemName={`el webhook ${displayUrl(data.url)}`}
                isDeleting={mutations.delete.isPending}
                onClose={() => setDeleting(false)}
                onConfirm={handleDelete}
            />
        </div>
    )
}

export default WebhookEndpointDetailPage
