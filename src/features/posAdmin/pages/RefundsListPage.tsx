import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { useCan } from '@/stores/useAuthStore'
import { formatCurrency, formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import {
    REFUND_STATUS_CLASSES,
    REFUND_STATUS_LABELS,
    useCancelRefund,
    useRefunds,
    type Refund,
    type RefundStatus,
} from '@features/pos'

const statusOptions = [
    { value: '', label: 'Todas' },
    ...Object.entries(REFUND_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const RefundsListPage = () => {
    const navigate = useNavigate()
    const canOperatePOS = useCan('pos:operate')
    const cancelRefund = useCancelRefund()
    const [statusFilter, setStatusFilter] = useState('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const { data, isLoading } = useRefunds({
        status: (statusFilter as RefundStatus) || undefined,
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize,
    })
    const refunds = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const handleCancel = async (refund: Refund) => {
        try {
            await cancelRefund.mutateAsync(refund.id)
            notifySuccess('Devolución cancelada')
        } catch (error) {
            notifyError(error, 'Error al cancelar la devolución')
        }
    }

    const columns: ColumnDef<Refund>[] = [
        {
            header: 'Devolución',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'Venta',
            accessorKey: 'originalSaleId',
            cell: (props) => (
                <button
                    className="text-primary hover:underline"
                    onClick={() =>
                        navigate(`/sales/${props.row.original.originalSaleId}`)
                    }
                >
                    #{props.row.original.originalSaleId}
                </button>
            ),
        },
        {
            header: 'Fecha',
            id: 'date',
            cell: (props) => {
                const { refundDate, createdAt } = props.row.original
                const date = refundDate ?? createdAt
                return date ? formatDatetime(date) : '-'
            },
        },
        {
            header: 'Total',
            accessorKey: 'total',
            cell: (props) => (
                <span className="font-medium">
                    {formatCurrency(props.row.original.total)}
                </span>
            ),
        },
        {
            header: 'Motivo',
            accessorKey: 'reason',
            cell: (props) => props.row.original.reason ?? '-',
        },
        {
            header: 'Procesada por',
            accessorKey: 'refundedBy',
            cell: (props) => props.row.original.refundedBy ?? '-',
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <Badge
                        content={REFUND_STATUS_LABELS[status]}
                        className={REFUND_STATUS_CLASSES[status]}
                    />
                )
            },
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) =>
                // Cancelling is a POS operation (pos:operate)
                canOperatePOS && props.row.original.status === 'PENDING' ? (
                    <Button
                        size="xs"
                        variant="plain"
                        loading={cancelRefund.isPending}
                        onClick={() => handleCancel(props.row.original)}
                    >
                        Cancelar
                    </Button>
                ) : null,
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
                                setStatusFilter(option?.value || '')
                                setPageIndex(1)
                            }}
                        />
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-4">
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold">Devoluciones</h4>
                        <p className="text-sm text-gray-500 mt-1">
                            Devoluciones del punto de venta, de la más reciente
                            a la más antigua
                        </p>
                    </div>
                    <DataTable
                        columns={columns}
                        data={refunds}
                        loading={isLoading}
                        pagingData={{ total, pageIndex, pageSize }}
                        onPaginationChange={setPageIndex}
                        onSelectChange={(size) => {
                            setPageSize(size)
                            setPageIndex(1)
                        }}
                    />
                </div>
            </Card>
        </>
    )
}

export default RefundsListPage
