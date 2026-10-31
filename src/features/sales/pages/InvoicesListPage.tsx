import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/shared/StatusBadge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { HiOutlineEye, HiOutlineRefresh } from 'react-icons/hi'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useCan } from '@/stores'
import {
    INVOICE_STATUS_TONES,
    INVOICE_STATUS_LABELS,
    invoiceIssuedAt,
    invoiceNumber,
    isFinalInvoice,
    InvoiceDocumentActions,
    InvoiceReason,
    useInvoiceRetryAction,
    useInvoices,
    useRetryInvoices,
    type Invoice,
    type InvoiceStatus,
} from '@features/invoicing'
import InvoicePreviewDialog from '../components/InvoicePreviewDialog'
import LabeledField from '@/components/shared/LabeledField'
import PageHeader from '@/components/shared/PageHeader'

const statusOptions = [
    { value: '', label: 'Todos' },
    ...Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const viewOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'attention', label: 'Requieren atención' },
]

const InvoicesListPage = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    // ?attention=1: pending invoices or those whose last attempt failed
    const attention = searchParams.get('attention') === '1'
    const [statusFilter, setStatusFilter] = useState('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selected, setSelected] = useState<Invoice | null>(null)
    const canRetry = useCan('sale:write')

    // faclab-invoicing filters, sorts (latest first) and pages
    const { data, isLoading, isError, refetch } = useInvoices({
        attention,
        status: (statusFilter as InvoiceStatus) || undefined,
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize,
    })
    const invoices = data?.items ?? []
    const total = data?.pagination?.total ?? 0
    const retry = useInvoiceRetryAction()
    const retryAll = useRetryInvoices()

    const handleRetryAll = async () => {
        try {
            const queued = await retryAll.mutateAsync()
            notifySuccess(
                'Reintento en curso',
                `Se reintentan ${queued} facturas en segundo plano`
            )
        } catch (error) {
            notifyError(error, 'No se pudieron reintentar las facturas')
        }
    }

    const columns: ColumnDef<Invoice>[] = [
        {
            header: 'Número',
            id: 'number',
            cell: (props) => (
                <span className="font-mono text-sm">
                    {invoiceNumber(props.row.original.accessCode)}
                </span>
            ),
        },
        {
            header: 'Venta',
            accessorKey: 'saleId',
            cell: (props) => (
                <button
                    className="text-primary hover:underline"
                    onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/sales/${props.row.original.saleId}`)
                    }}
                >
                    #{props.row.original.saleId}
                </button>
            ),
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <StatusBadge tone={INVOICE_STATUS_TONES[status]}>
                        {INVOICE_STATUS_LABELS[status]}
                    </StatusBadge>
                )
            },
        },
        {
            header: 'Motivo',
            id: 'reason',
            cell: (props) => <InvoiceReason invoice={props.row.original} />,
        },
        {
            header: 'Emitida',
            id: 'issuedAt',
            cell: (props) => {
                const date = invoiceIssuedAt(props.row.original)
                return date ? formatDatetime(date) : '-'
            },
        },
        {
            header: 'Último cambio',
            id: 'lastChange',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDatetime(props.row.original.updatedAt)}
                </span>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => {
                const invoice = props.row.original
                return (
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="plain"
                            aria-label="Ver detalle"
                            icon={<HiOutlineEye />}
                            onClick={() => setSelected(invoice)}
                        />
                        <InvoiceDocumentActions invoice={invoice} />
                        {canRetry && !isFinalInvoice(invoice) && (
                            <Button
                                size="sm"
                                variant="plain"
                                aria-label="Reintentar"
                                title="Reintentar ahora"
                                icon={<HiOutlineRefresh />}
                                loading={retry.retryingId === invoice.id}
                                onClick={() => retry.run(invoice)}
                            />
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <>
            <PageHeader
                title="Facturas"
                description={
                    attention
                        ? 'Facturas pendientes o cuyo último intento falló. Las que esperan el perfil fiscal o el certificado se emiten solas cuando se completan.'
                        : 'Facturas electrónicas emitidas al SRI'
                }
                actions={
                    attention &&
                    canRetry &&
                    total > 0 && (
                        <Button
                            size="sm"
                            icon={<HiOutlineRefresh />}
                            loading={retryAll.isPending}
                            onClick={handleRetryAll}
                        >
                            Reintentar todas
                        </Button>
                    )
                }
            />
            <Card className="mb-4">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="Mostrar">
                        <Select
                            options={viewOptions}
                            value={viewOptions.find(
                                (o) =>
                                    o.value ===
                                    (attention ? 'attention' : 'all')
                            )}
                            onChange={(option) => {
                                setSearchParams(
                                    option?.value === 'attention'
                                        ? { attention: '1' }
                                        : {}
                                )
                                setPageIndex(1)
                            }}
                        />
                    </LabeledField>
                    <LabeledField label="Estado">
                        <Select
                            options={statusOptions}
                            value={statusOptions.find(
                                (o) => o.value === statusFilter
                            )}
                            onChange={(option) => {
                                setStatusFilter(
                                    (option?.value as InvoiceStatus) || ''
                                )
                                setPageIndex(1)
                            }}
                        />
                    </LabeledField>
                </div>
            </Card>

            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={invoices}
                    loading={isLoading}
                    error={
                        isError
                            ? new Error(
                                  'El servicio de facturación no responde'
                              )
                            : undefined
                    }
                    pagingData={{
                        total,
                        pageIndex,
                        pageSize,
                    }}
                    onRetry={refetch}
                    onPaginationChange={setPageIndex}
                    onSelectChange={(size) => {
                        setPageSize(size)
                        setPageIndex(1)
                    }}
                />
            </Card>

            <InvoicePreviewDialog
                invoice={selected}
                onClose={() => setSelected(null)}
            />
        </>
    )
}

export default InvoicesListPage
