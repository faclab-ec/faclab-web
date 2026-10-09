import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { HiOutlineEye, HiOutlineRefresh } from 'react-icons/hi'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useCan } from '@/stores'
import {
    INVOICE_STATUS_CLASSES,
    INVOICE_STATUS_LABELS,
    invoiceIssuedAt,
    invoiceNumber,
    isFinalInvoice,
    InvoiceReason,
    useInvoiceRetryAction,
    useInvoices,
    useRetryInvoices,
    type Invoice,
    type InvoiceStatus,
} from '@features/invoicing'
import InvoicePreviewDialog from '../components/InvoicePreviewDialog'

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

    const {
        data: invoices = [],
        isLoading,
        isError,
    } = useInvoices({
        attention,
    })
    const retry = useInvoiceRetryAction()
    const retryAll = useRetryInvoices()

    // faclab-invoicing returns them all: filter, sort and page here
    const filtered = useMemo(
        () =>
            invoices
                .filter((i) => !statusFilter || i.status === statusFilter)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        [invoices, statusFilter]
    )
    const page = filtered.slice(
        (pageIndex - 1) * pageSize,
        pageIndex * pageSize
    )

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
                    <Badge
                        content={INVOICE_STATUS_LABELS[status]}
                        className={INVOICE_STATUS_CLASSES[status]}
                    />
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
            <Card className="mb-4">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Mostrar
                        </label>
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
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Estado
                        </label>
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
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-4">
                    <div className="flex justify-between items-start mb-4 gap-4">
                        <div>
                            <h4 className="text-lg font-semibold">Facturas</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                {attention
                                    ? 'Facturas pendientes o cuyo último intento falló. Las que esperan la configuración fiscal se emiten solas cuando se completa.'
                                    : 'Facturas electrónicas emitidas al SRI'}
                            </p>
                        </div>
                        {attention && canRetry && invoices.length > 0 && (
                            <Button
                                size="sm"
                                icon={<HiOutlineRefresh />}
                                loading={retryAll.isPending}
                                onClick={handleRetryAll}
                            >
                                Reintentar todas
                            </Button>
                        )}
                    </div>
                    {isError ? (
                        <p className="text-center py-8 text-red-500">
                            No se pudieron cargar las facturas: el servicio de
                            facturación no responde
                        </p>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={page}
                            loading={isLoading}
                            pagingData={{
                                total: filtered.length,
                                pageIndex,
                                pageSize,
                            }}
                            onPaginationChange={setPageIndex}
                            onSelectChange={(size) => {
                                setPageSize(size)
                                setPageIndex(1)
                            }}
                        />
                    )}
                </div>
            </Card>

            <InvoicePreviewDialog
                invoice={selected}
                onClose={() => setSelected(null)}
            />
        </>
    )
}

export default InvoicesListPage
