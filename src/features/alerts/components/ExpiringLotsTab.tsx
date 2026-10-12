import { useNavigate } from 'react-router-dom'
import StatusBadge from '@/components/shared/StatusBadge'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { type StockAlert } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'

interface ExpiringLotsTabProps {
    data: StockAlert[]
    loading: boolean
}

const ExpiringLotsTab = ({ data, loading }: ExpiringLotsTabProps) => {
    const navigate = useNavigate()

    const columns: ColumnDef<StockAlert>[] = [
        {
            header: 'Producto',
            accessorKey: 'productName',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.productName}
                </span>
            ),
        },
        {
            header: 'SKU',
            accessorKey: 'sku',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {props.row.original.sku}
                </span>
            ),
        },
        {
            header: 'Lote',
            accessorKey: 'lotId',
            cell: (props) => {
                const lotId = props.row.original.lotId
                return lotId ? (
                    <button
                        className="text-primary hover:underline"
                        onClick={() => navigate(`/lots`)}
                    >
                        #{lotId}
                    </button>
                ) : (
                    '-'
                )
            },
        },
        {
            header: 'Cantidad',
            accessorKey: 'currentQuantity',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.currentQuantity}
                </span>
            ),
        },
        {
            header: 'Días para Vencer',
            accessorKey: 'daysToExpiry',
            cell: (props) => {
                const d = props.row.original.daysToExpiry
                if (d === null) return '-'
                const isUrgent = d <= 7
                return (
                    <StatusBadge
                        tone={isUrgent ? 'danger' : 'warning'}
                    >{`${d} días`}</StatusBadge>
                )
            },
        },
    ]

    if (data.length === 0 && !loading) {
        return (
            <EmptyState className="!py-8" title="Sin lotes próximos a vencer" />
        )
    }

    return (
        <DataTable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={{
                total: data.length,
                pageIndex: 1,
                pageSize: data.length || 10,
            }}
        />
    )
}

export default ExpiringLotsTab
