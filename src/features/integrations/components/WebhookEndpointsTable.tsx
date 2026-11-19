import { Link } from 'react-router-dom'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import { formatDatetime } from '@shared/lib/format'
import { displayUrl, ownerName } from '../lib/endpoints'
import {
    WEBHOOK_EVENT_LABELS,
    type IntegrationClient,
    type WebhookEndpoint,
} from '../model/types'
import EndpointStatusBadge from './EndpointStatusBadge'

interface WebhookEndpointsTableProps {
    endpoints: WebhookEndpoint[]
    clients: IntegrationClient[]
    loading?: boolean
    error?: unknown
    onRetry?: () => void
    /** Sin la columna del dueño (dentro del detalle de un cliente) */
    hideOwner?: boolean
    pagingData?: { total: number; pageIndex: number; pageSize: number }
    onPaginationChange?: (page: number) => void
    onSelectChange?: (size: number) => void
}

const WebhookEndpointsTable = ({
    endpoints,
    clients,
    hideOwner = false,
    ...table
}: WebhookEndpointsTableProps) => {
    const columns: ColumnDef<WebhookEndpoint>[] = [
        {
            header: 'URL',
            accessorKey: 'url',
            cell: (props) => (
                <div className="max-w-[28rem]">
                    <Link
                        className="break-all font-semibold text-primary-600 hover:underline dark:text-primary-400"
                        to={`/settings/webhooks/${props.row.original.id}`}
                    >
                        {displayUrl(props.row.original.url)}
                    </Link>
                    {props.row.original.description && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {props.row.original.description}
                        </span>
                    )}
                </div>
            ),
        },
        ...(hideOwner
            ? []
            : [
                  {
                      header: 'Dueño',
                      id: 'owner',
                      cell: (props) => ownerName(props.row.original, clients),
                  } satisfies ColumnDef<WebhookEndpoint>,
              ]),
        {
            header: 'Eventos',
            accessorKey: 'eventTypes',
            cell: (props) => (
                <span
                    className="text-sm"
                    title={props.row.original.eventTypes
                        .map((t) => WEBHOOK_EVENT_LABELS[t])
                        .join(', ')}
                >
                    {props.row.original.eventTypes.length === 1
                        ? WEBHOOK_EVENT_LABELS[props.row.original.eventTypes[0]]
                        : `${props.row.original.eventTypes.length} eventos`}
                </span>
            ),
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => (
                <EndpointStatusBadge endpoint={props.row.original} />
            ),
        },
        {
            header: 'Última entrega',
            accessorKey: 'lastSuccessAt',
            cell: (props) =>
                props.row.original.failingSince ? (
                    <span className="text-red-600 dark:text-red-400">
                        Falla desde{' '}
                        {formatDatetime(props.row.original.failingSince)}
                    </span>
                ) : props.row.original.lastSuccessAt ? (
                    formatDatetime(props.row.original.lastSuccessAt)
                ) : (
                    'Ninguna'
                ),
        },
    ]

    return <DataTable columns={columns} data={endpoints} {...table} />
}

export default WebhookEndpointsTable
