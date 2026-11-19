import Card from '@/components/ui/Card'
import { StatCard } from '@/components/shared'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import { formatDate, formatDatetime } from '@shared/lib/format'
import { useIntegrationUsage } from '../hooks/useIntegrations'
import { USAGE_DAYS, usageTotals, usageWindow } from '../lib/usage'
import type { IntegrationUsageDay } from '../model/types'

const dayLabel = (day: string) => {
    const [y, m, d] = day.split('-').map(Number)
    return formatDate(new Date(y, m - 1, d), {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    })
}

const columns: ColumnDef<IntegrationUsageDay>[] = [
    {
        header: 'Día',
        accessorKey: 'day',
        cell: (props) => dayLabel(props.row.original.day),
    },
    { header: 'Tokens', accessorKey: 'tokenRequests' },
    { header: 'Tokens rechazados', accessorKey: 'tokenFailures' },
    { header: 'Solicitudes', accessorKey: 'requests' },
    { header: 'Errores', accessorKey: 'errors' },
    {
        header: 'Última solicitud',
        accessorKey: 'lastSeenAt',
        cell: (props) =>
            props.row.original.lastSeenAt
                ? `${formatDatetime(props.row.original.lastSeenAt)} · ${
                      props.row.original.lastIp ?? ''
                  }`
                : '-',
    },
]

interface ClientUsageSectionProps {
    clientId: number
}

/** Solicitudes por día de los últimos 30 días, con los días sin actividad. */
const ClientUsageSection = ({ clientId }: ClientUsageSectionProps) => {
    const usage = useIntegrationUsage(clientId)
    const days = usageWindow(usage.data ?? [])
    const totals = usageTotals(days)

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label={`Solicitudes (${USAGE_DAYS} días)`}
                    value={totals.requests}
                    loading={usage.isLoading}
                />
                <StatCard
                    label="Errores"
                    tone={totals.errors ? 'danger' : 'neutral'}
                    value={totals.errors}
                    loading={usage.isLoading}
                />
                <StatCard
                    label="Tokens emitidos"
                    value={totals.tokenRequests}
                    loading={usage.isLoading}
                />
                <StatCard
                    label="Tokens rechazados"
                    tone={totals.tokenFailures ? 'warning' : 'neutral'}
                    value={totals.tokenFailures}
                    loading={usage.isLoading}
                />
            </div>
            <Card
                header={<h2 className="text-lg">Uso por día</h2>}
                bodyClass="p-0"
            >
                <DataTable
                    columns={columns}
                    data={usage.isLoading ? [] : days}
                    loading={usage.isLoading}
                    error={usage.error}
                    onRetry={() => usage.refetch()}
                />
            </Card>
        </div>
    )
}

export default ClientUsageSection
