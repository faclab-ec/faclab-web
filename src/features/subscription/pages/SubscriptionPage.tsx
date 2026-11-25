import { HiOutlineDocumentText, HiOutlineReceiptRefund } from 'react-icons/hi'
import Alert from '@/components/ui/Alert'
import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import Spinner from '@/components/ui/Spinner'
import {
    DataTable,
    ErrorState,
    PageHeader,
    StatCard,
    StatusBadge,
} from '@/components/shared'
import type { ColumnDef } from '@/components/shared/DataTable'
import { formatDate } from '@shared/lib/format'
import { useSubscription } from '../hooks/useSubscription'
import {
    PLAN_RESOURCE_LABELS,
    SUBSCRIPTION_STATUS_LABELS,
    SUBSCRIPTION_STATUS_TONES,
    limitLabel,
    periodLabel,
    usagePercent,
    usageTone,
    type MonthlyDocuments,
    type ResourceUsage,
} from '../model/types'

const PROGRESS_COLORS = {
    success: 'emerald-500',
    warning: 'amber-500',
    danger: 'red-500',
    neutral: 'gray-300',
    info: 'blue-500',
} as const

const monthColumns: ColumnDef<MonthlyDocuments>[] = [
    {
        header: 'Mes',
        accessorKey: 'period',
        cell: (props) => periodLabel(props.row.original.period),
    },
    { header: 'Facturas', accessorKey: 'invoices' },
    { header: 'Notas de crédito', accessorKey: 'creditNotes' },
    { header: 'Total', accessorKey: 'total' },
]

const ResourceRow = ({ usage }: { usage: ResourceUsage }) => {
    const tone = usageTone(usage.used, usage.limit)
    return (
        <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="sm:w-56">
                {PLAN_RESOURCE_LABELS[usage.resource]}
            </span>
            <div className="flex-1">
                {usage.limit !== null && (
                    <Progress
                        percent={usagePercent(usage.used, usage.limit)}
                        color={PROGRESS_COLORS[tone]}
                        showInfo={false}
                        size="sm"
                    />
                )}
            </div>
            <span className="tabular-nums text-gray-700 dark:text-gray-200 sm:w-40 sm:text-right">
                {usage.used.toLocaleString('es-EC')} de{' '}
                {limitLabel(usage.limit)}
            </span>
        </li>
    )
}

/** El plan de la empresa, el estado de su suscripción y lo que usa (S8.4). */
const SubscriptionPage = () => {
    const { data, error, isLoading, refetch } = useSubscription()

    const header = (
        <PageHeader
            title="Plan y uso"
            description="El plan de la empresa, el estado de su suscripción y lo que usa de cada límite. Para cambiar de plan, comunícate con Faclab."
        />
    )
    if (error) {
        return (
            <>
                {header}
                <ErrorState error={error} onRetry={() => refetch()} />
            </>
        )
    }
    if (isLoading || !data) {
        return (
            <>
                {header}
                <div className="flex justify-center py-10">
                    <Spinner size={32} />
                </div>
            </>
        )
    }

    const current = data.documents.months.at(-1)
    const documentsLimit = data.documents.limit
    const documentsTone = current
        ? usageTone(current.total, documentsLimit)
        : 'neutral'

    return (
        <div className="flex flex-col gap-4">
            {header}
            {data.readOnly && (
                <Alert showIcon type="danger">
                    La empresa solo puede consultar: no se pueden registrar
                    ventas ni cambiar datos. Las facturas de las ventas ya
                    hechas se siguen emitiendo.
                </Alert>
            )}
            <Card header={<h2 className="text-lg">Plan</h2>}>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-semibold">
                        {data.plan?.name ?? 'Sin plan configurado'}
                    </span>
                    <StatusBadge tone={SUBSCRIPTION_STATUS_TONES[data.status]}>
                        {SUBSCRIPTION_STATUS_LABELS[data.status]}
                    </StatusBadge>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {data.trialEndsAt && (
                        <div>
                            <dt className="text-gray-500">Fin de la prueba</dt>
                            <dd>{formatDate(data.trialEndsAt)}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-gray-500">API pública</dt>
                        <dd>
                            {data.plan === null || data.plan.publicApi
                                ? 'Incluida'
                                : 'No incluida'}
                        </dd>
                    </div>
                </dl>
            </Card>
            <Card header={<h2 className="text-lg">Límites del plan</h2>}>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.resources.map((usage) => (
                        <ResourceRow key={usage.resource} usage={usage} />
                    ))}
                </ul>
            </Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    label="Comprobantes este mes"
                    value={current?.total ?? 0}
                    tone={documentsTone}
                    icon={<HiOutlineDocumentText />}
                    hint={
                        documentsLimit === null
                            ? 'Sin límite'
                            : `de ${limitLabel(documentsLimit)} del plan`
                    }
                />
                <StatCard
                    label="Facturas"
                    value={current?.invoices ?? 0}
                    icon={<HiOutlineDocumentText />}
                />
                <StatCard
                    label="Notas de crédito"
                    value={current?.creditNotes ?? 0}
                    icon={<HiOutlineReceiptRefund />}
                />
            </div>
            <Card
                header={<h2 className="text-lg">Comprobantes por mes</h2>}
                bodyClass="p-0"
            >
                <DataTable
                    columns={monthColumns}
                    data={[...data.documents.months].reverse()}
                />
            </Card>
            <p className="text-sm text-gray-500">
                Cuentan las facturas y notas de crédito que el SRI autorizó, en
                el mes en que se autorizaron. El límite de comprobantes no
                detiene la facturación de las ventas ya hechas.
            </p>
        </div>
    )
}

export default SubscriptionPage
