import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Tabs from '@/components/ui/Tabs'
import StatusBadge from '@/components/shared/StatusBadge'
import LabeledField from '@/components/shared/LabeledField'
import PageHeader from '@/components/shared/PageHeader'
import { HiOutlineEye } from 'react-icons/hi'
import { formatCurrency, formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useCan } from '@/stores'
import {
    useInvoiceDiscrepancies,
    useRequestInvoice,
    useSalesList,
} from '../hooks/useSales'
import {
    DISCREPANCY_KIND_LABELS,
    DISCREPANCY_STATUS_LABELS,
    DISCREPANCY_STATUS_TONES,
    type DiscrepancyStatus,
    type InvoiceDiscrepancy,
    type Sale,
} from '../model/types'
import DiscrepancyInvoicing from '../components/DiscrepancyInvoicing'
import DiscrepancyActionButtons from '../components/DiscrepancyActions'
import ReviewDiscrepancyDialog from '../components/ReviewDiscrepancyDialog'

const { TabList, TabNav, TabContent } = Tabs

const statusOptions = Object.entries(DISCREPANCY_STATUS_LABELS).map(
    ([value, label]) => ({ value: value as DiscrepancyStatus, label })
)

// Pocas por página: cada fila consulta su venta en faclab-invoicing
const PAGE_SIZE = 20

const saleLabel = (id: number, number: string | null | undefined) =>
    number ?? `#${id}`

/** Desde cuándo la venta espera el resultado de su factura */
const waitingSince = (discrepancy: InvoiceDiscrepancy) =>
    discrepancy.sale?.invoiceRequestedAt ?? discrepancy.sale?.saleDate ?? null

const DiscrepanciesTab = () => {
    const navigate = useNavigate()
    const canWrite = useCan('sale:write')
    const [status, setStatus] = useState<DiscrepancyStatus>('open')
    const [pageIndex, setPageIndex] = useState(1)
    const [reviewing, setReviewing] = useState<InvoiceDiscrepancy | null>(null)

    const { data, isLoading, error, refetch } = useInvoiceDiscrepancies({
        status,
        limit: PAGE_SIZE,
        offset: (pageIndex - 1) * PAGE_SIZE,
    })
    const discrepancies = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const columns: ColumnDef<InvoiceDiscrepancy>[] = [
        {
            header: 'Venta',
            id: 'sale',
            cell: (props) => {
                const { saleId, sale } = props.row.original
                return (
                    <Button
                        size="sm"
                        variant="plain"
                        className="!px-0 font-medium"
                        onClick={() => navigate(`/sales/${saleId}`)}
                    >
                        {saleLabel(saleId, sale?.number)}
                    </Button>
                )
            },
        },
        {
            header: 'Discrepancia',
            id: 'kind',
            cell: (props) => {
                const discrepancy = props.row.original
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span>{DISCREPANCY_KIND_LABELS[discrepancy.kind]}</span>
                        <StatusBadge
                            tone={DISCREPANCY_STATUS_TONES[discrepancy.status]}
                        >
                            {DISCREPANCY_STATUS_LABELS[discrepancy.status]}
                        </StatusBadge>
                    </div>
                )
            },
        },
        {
            header: 'Total',
            id: 'total',
            cell: (props) => {
                const sale = props.row.original.sale
                return sale ? formatCurrency(sale.total) : '-'
            },
        },
        {
            header: 'Esperando desde',
            id: 'since',
            cell: (props) => {
                const since = waitingSince(props.row.original)
                return (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {since ? formatDatetime(since) : '-'}
                    </span>
                )
            },
        },
        {
            header: 'En facturación',
            id: 'invoicing',
            cell: (props) => (
                <DiscrepancyInvoicing saleId={props.row.original.saleId} />
            ),
        },
        {
            header: 'Revisión',
            id: 'review',
            cell: (props) => {
                const { reviewedByName, reviewedAt, reviewNote } =
                    props.row.original
                if (!reviewedAt) return '-'
                return (
                    <div className="text-sm">
                        <p>
                            {reviewedByName ?? '-'} ·{' '}
                            {formatDatetime(reviewedAt)}
                        </p>
                        {reviewNote && (
                            <p className="text-xs text-gray-500">
                                {reviewNote}
                            </p>
                        )}
                    </div>
                )
            },
        },
    ]
    if (canWrite) {
        columns.push({
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <DiscrepancyActionButtons
                    discrepancy={props.row.original}
                    onReview={setReviewing}
                />
            ),
        })
    }

    return (
        <>
            <div className="mb-4 max-w-xs">
                <LabeledField label="Estado">
                    <Select
                        options={statusOptions}
                        value={statusOptions.find((o) => o.value === status)}
                        onChange={(option) => {
                            if (option) setStatus(option.value)
                            setPageIndex(1)
                        }}
                    />
                </LabeledField>
            </div>
            <DataTable
                columns={columns}
                data={discrepancies}
                loading={isLoading}
                error={error}
                pagingData={{ total, pageIndex, pageSize: PAGE_SIZE }}
                onRetry={refetch}
                onPaginationChange={setPageIndex}
            />
            <ReviewDiscrepancyDialog
                discrepancy={reviewing}
                onClose={() => setReviewing(null)}
            />
        </>
    )
}

const RejectedTab = () => {
    const navigate = useNavigate()
    const canWrite = useCan('sale:write')
    const [pageIndex, setPageIndex] = useState(1)
    const requestInvoice = useRequestInvoice()
    const { data, isLoading, error, refetch } = useSalesList({
        status: 'CONFIRMED',
        invoiceStatus: 'REJECTED',
        limit: PAGE_SIZE,
        offset: (pageIndex - 1) * PAGE_SIZE,
    })
    const sales = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const handleResend = async (sale: Sale) => {
        try {
            await requestInvoice.mutateAsync(sale.id)
            notifySuccess(
                'Venta reenviada a facturación',
                'La factura aparecerá en unos momentos'
            )
        } catch (error) {
            notifyError(error, 'No se pudo reenviar la venta a facturación')
        }
    }

    const columns: ColumnDef<Sale>[] = [
        {
            header: 'Venta',
            id: 'number',
            cell: (props) => (
                <span className="font-medium">
                    {saleLabel(
                        props.row.original.id,
                        props.row.original.number
                    )}
                </span>
            ),
        },
        {
            header: 'Cliente',
            id: 'customer',
            cell: (props) =>
                props.row.original.customerName ?? 'Consumidor final',
        },
        {
            header: 'Total',
            id: 'total',
            cell: (props) => formatCurrency(props.row.original.total),
        },
        {
            header: 'Motivo del SRI',
            id: 'reason',
            cell: (props) => (
                <p
                    className="text-sm text-red-600 dark:text-red-400 line-clamp-2"
                    title={props.row.original.invoiceRejectionReason ?? ''}
                >
                    {props.row.original.invoiceRejectionReason ??
                        'Rechazada por el SRI'}
                </p>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label="Ver detalle"
                        icon={<HiOutlineEye />}
                        onClick={() =>
                            navigate(`/sales/${props.row.original.id}`)
                        }
                    />
                    {canWrite && (
                        <Button
                            size="sm"
                            loading={
                                requestInvoice.isPending &&
                                requestInvoice.variables ===
                                    props.row.original.id
                            }
                            onClick={() => handleResend(props.row.original)}
                        >
                            Reenviar
                        </Button>
                    )}
                </div>
            ),
        },
    ]

    return (
        <>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Corrige los datos (por ejemplo, la identificación del cliente) y
                reenvía la venta para emitir una factura nueva, o anúlala.
            </p>
            <DataTable
                columns={columns}
                data={sales}
                loading={isLoading}
                error={error}
                pagingData={{ total, pageIndex, pageSize: PAGE_SIZE }}
                onRetry={refetch}
                onPaginationChange={setPageIndex}
            />
        </>
    )
}

/**
 * Ventas cuya factura necesita a alguien (S4.3): las discrepancias que abre la
 * conciliación del core y las ventas que el SRI rechazó
 */
const SalesAttentionPage = () => (
    <>
        <PageHeader
            title="Ventas que requieren atención"
            description="Ventas confirmadas que siguen sin resultado de facturación, facturas autorizadas de ventas anuladas y facturas rechazadas por el SRI"
        />
        <Card>
            <Tabs defaultValue="discrepancies">
                <TabList>
                    <TabNav value="discrepancies">Discrepancias</TabNav>
                    <TabNav value="rejected">Rechazadas por el SRI</TabNav>
                </TabList>
                <div className="mt-4">
                    <TabContent value="discrepancies">
                        <DiscrepanciesTab />
                    </TabContent>
                    <TabContent value="rejected">
                        <RejectedTab />
                    </TabContent>
                </div>
            </Tabs>
        </Card>
    </>
)

export default SalesAttentionPage
