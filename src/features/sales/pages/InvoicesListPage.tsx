import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { HiOutlineEye } from 'react-icons/hi'
import { formatDatetime } from '@shared/lib/format'
import { useInvoices } from '../hooks/useSales'
import InvoicePreviewDialog from '../components/InvoicePreviewDialog'
import {
    INVOICE_STATUS_CLASSES,
    INVOICE_STATUS_LABELS,
    invoiceIssuedAt,
    invoiceNumber,
    type Invoice,
    type InvoiceStatus,
} from '../model/types'

const statusOptions = [
    { value: '', label: 'Todos' },
    ...Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const InvoicesListPage = () => {
    const navigate = useNavigate()
    const [statusFilter, setStatusFilter] = useState('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selected, setSelected] = useState<Invoice | null>(null)

    const { data: invoices = [], isLoading } = useInvoices()

    // faclab-invoicing returns them all: filter, sort and page here
    const filtered = useMemo(
        () =>
            invoices
                .filter((i) => !statusFilter || i.status === statusFilter)
                .sort((a, b) =>
                    (invoiceIssuedAt(b) ?? '').localeCompare(
                        invoiceIssuedAt(a) ?? ''
                    )
                ),
        [invoices, statusFilter]
    )
    const page = filtered.slice(
        (pageIndex - 1) * pageSize,
        pageIndex * pageSize
    )

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
            cell: (props) => {
                const history = props.row.original.statusHistory
                const last = history[history.length - 1]
                return (
                    <span
                        className="text-sm text-gray-600 dark:text-gray-400"
                        title={last?.description}
                    >
                        {last ? formatDatetime(last.statusDate) : '-'}
                    </span>
                )
            },
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    aria-label="Ver XML"
                    icon={<HiOutlineEye />}
                    onClick={() => setSelected(props.row.original)}
                />
            ),
        },
    ]

    return (
        <>
            <Card className="mb-4">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold">Facturas</h4>
                        <p className="text-sm text-gray-500 mt-1">
                            Facturas electrónicas emitidas al SRI
                        </p>
                    </div>
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
