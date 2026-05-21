import { useNavigate } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { type StockAlert } from '../model/types'

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
                    <Badge
                        content={`${d} días`}
                        className={
                            isUrgent
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                        }
                    />
                )
            },
        },
    ]

    if (data.length === 0 && !loading) {
        return (
            <div className="text-center py-8 text-gray-500">
                Sin lotes próximos a vencer
            </div>
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
