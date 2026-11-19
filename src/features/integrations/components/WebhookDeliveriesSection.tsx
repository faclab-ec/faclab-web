import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import {
    useWebhookDeliveries,
    useWebhookEndpointMutations,
} from '../hooks/useWebhooks'
import { INTEGRATION_ERROR_MESSAGES } from '../model/errors'
import {
    TEST_EVENT,
    WEBHOOK_DELIVERY_STATUSES,
    WEBHOOK_DELIVERY_STATUS_LABELS,
    WEBHOOK_DELIVERY_STATUS_TONES,
    WEBHOOK_EVENT_LABELS,
    WEBHOOK_EVENT_TYPES,
    eventLabel,
    type WebhookDelivery,
    type WebhookDeliveryStatus,
    type WebhookEndpoint,
} from '../model/types'

const PAGE_SIZE = 20

const statusOptions = [
    { value: undefined as WebhookDeliveryStatus | undefined, label: 'Todas' },
    ...WEBHOOK_DELIVERY_STATUSES.map((status) => ({
        value: status as WebhookDeliveryStatus | undefined,
        label: `${WEBHOOK_DELIVERY_STATUS_LABELS[status]}s`,
    })),
]

const eventOptions = [
    { value: undefined as string | undefined, label: 'Todos los eventos' },
    ...WEBHOOK_EVENT_TYPES.map((type) => ({
        value: type as string | undefined,
        label: WEBHOOK_EVENT_LABELS[type],
    })),
    { value: TEST_EVENT as string | undefined, label: 'Prueba' },
]

/** Lo que pasó en el último intento */
const lastResult = (delivery: WebhookDelivery) => {
    if (delivery.status === 'delivered') {
        return `${delivery.responseStatus ?? ''} en ${
            delivery.durationMs ?? '?'
        } ms`
    }
    if (!delivery.lastAttemptAt) return 'Sin intentos todavía'
    const answer = delivery.responseStatus
        ? `Respondió ${delivery.responseStatus}`
        : delivery.lastError ?? 'Sin respuesta'
    return delivery.responseStatus && delivery.lastError
        ? `${answer}: ${delivery.lastError}`
        : answer
}

interface WebhookDeliveriesSectionProps {
    endpoint: WebhookEndpoint
}

/** El historial de 30 días del endpoint, con el reenvío de cada entrega. */
const WebhookDeliveriesSection = ({
    endpoint,
}: WebhookDeliveriesSectionProps) => {
    const [page, setPage] = useState(1)
    const [status, setStatus] = useState<WebhookDeliveryStatus | undefined>()
    const [eventType, setEventType] = useState<string | undefined>()
    const deliveries = useWebhookDeliveries(endpoint.id, {
        status,
        eventType,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    })
    const { retry } = useWebhookEndpointMutations()
    const disabled = endpoint.status === 'disabled'

    const handleRetry = async (delivery: WebhookDelivery) => {
        try {
            await retry.mutateAsync({
                id: endpoint.id,
                deliveryId: delivery.id,
            })
            notifySuccess(
                'Entrega en cola',
                'Se envía de nuevo con el mismo webhook-id'
            )
        } catch (err) {
            notifyError(err, 'No se pudo reenviar', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    const columns: ColumnDef<WebhookDelivery>[] = [
        {
            header: 'Evento',
            accessorKey: 'eventType',
            cell: (props) => (
                <div>
                    <span>{eventLabel(props.row.original.eventType)}</span>
                    <span className="block font-mono text-xs text-gray-500 dark:text-gray-400">
                        {props.row.original.messageId}
                    </span>
                </div>
            ),
        },
        {
            header: 'Ocurrió',
            accessorKey: 'occurredAt',
            cell: (props) => formatDatetime(props.row.original.occurredAt),
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => (
                <StatusBadge
                    tone={
                        WEBHOOK_DELIVERY_STATUS_TONES[props.row.original.status]
                    }
                >
                    {WEBHOOK_DELIVERY_STATUS_LABELS[props.row.original.status]}
                </StatusBadge>
            ),
        },
        {
            header: 'Intentos',
            accessorKey: 'attempts',
            cell: (props) =>
                props.row.original.status === 'pending' &&
                props.row.original.nextAttemptAt
                    ? `${
                          props.row.original.attempts
                      } · próximo ${formatDatetime(
                          props.row.original.nextAttemptAt
                      )}`
                    : props.row.original.attempts,
        },
        {
            header: 'Último resultado',
            id: 'result',
            cell: (props) => (
                <span className="text-sm">
                    {lastResult(props.row.original)}
                </span>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) =>
                props.row.original.status === 'pending' ? null : (
                    <Button
                        size="xs"
                        variant="plain"
                        disabled={disabled || retry.isPending}
                        title={
                            disabled
                                ? 'Activa el webhook para reenviar'
                                : undefined
                        }
                        onClick={() => handleRetry(props.row.original)}
                    >
                        Reenviar
                    </Button>
                ),
        },
    ]

    return (
        <Card
            header={<h2 className="text-lg">Entregas (30 días)</h2>}
            headerExtra={
                <div className="flex flex-wrap gap-2">
                    <Select
                        size="sm"
                        className="min-w-[140px]"
                        aria-label="Estado de la entrega"
                        options={statusOptions}
                        value={
                            statusOptions.find((o) => o.value === status) ??
                            null
                        }
                        onChange={(option) => {
                            setStatus(option?.value)
                            setPage(1)
                        }}
                    />
                    <Select
                        size="sm"
                        className="min-w-[200px]"
                        aria-label="Evento de la entrega"
                        options={eventOptions}
                        value={
                            eventOptions.find((o) => o.value === eventType) ??
                            null
                        }
                        onChange={(option) => {
                            setEventType(option?.value)
                            setPage(1)
                        }}
                    />
                </div>
            }
            bodyClass="p-0"
        >
            <DataTable
                columns={columns}
                data={deliveries.data?.items ?? []}
                loading={deliveries.isLoading}
                error={deliveries.error}
                pagingData={{
                    total: deliveries.data?.pagination?.total ?? 0,
                    pageIndex: page,
                    pageSize: PAGE_SIZE,
                }}
                onRetry={() => deliveries.refetch()}
                onPaginationChange={setPage}
            />
        </Card>
    )
}

export default WebhookDeliveriesSection
