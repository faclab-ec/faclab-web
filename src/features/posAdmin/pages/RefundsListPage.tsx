import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Select from '@/components/ui/Select'
import { useCan } from '@/stores/useAuthStore'
import { formatCurrency, formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import {
    REFUND_STATUS_TONES,
    REFUND_STATUS_LABELS,
    useCancelRefund,
    useRefunds,
    type Refund,
    type RefundStatus,
} from '@features/pos'
import LabeledField from '@/components/shared/LabeledField'
import PageHeader from '@/components/shared/PageHeader'

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

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useRefunds({
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
                    <StatusBadge tone={REFUND_STATUS_TONES[status]}>
                        {REFUND_STATUS_LABELS[status]}
                    </StatusBadge>
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
            <PageHeader
                title="Devoluciones"
                description="Devoluciones del punto de venta, de la más reciente a la más antigua"
            />
            <Card className="mb-4">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="Estado">
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
                    </LabeledField>
                </div>
            </Card>

            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={refunds}
                    loading={isLoading}
                    error={listError}
                    pagingData={{ total, pageIndex, pageSize }}
                    onRetry={refetch}
                    onPaginationChange={setPageIndex}
                    onSelectChange={(size) => {
                        setPageSize(size)
                        setPageIndex(1)
                    }}
                />
            </Card>
        </>
    )
}

export default RefundsListPage
