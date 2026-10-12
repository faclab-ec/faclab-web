import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { type StockAlert } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'

interface StockAlertTabProps {
    data: StockAlert[]
    loading: boolean
    emptyMessage: string
    getWarehouseName: (warehouseId: number | null) => string
}

const StockAlertTab = ({
    data,
    loading,
    emptyMessage,
    getWarehouseName,
}: StockAlertTabProps) => {
    const navigate = useNavigate()

    const columns: ColumnDef<StockAlert>[] = [
        {
            header: 'Producto',
            accessorKey: 'productName',
            cell: (props) => (
                <button
                    className="text-primary font-medium hover:underline text-left"
                    onClick={() => navigate(`/catalog/products`)}
                >
                    {props.row.original.productName}
                </button>
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
            header: 'Cantidad Actual',
            accessorKey: 'currentQuantity',
            cell: (props) => (
                <span className="font-semibold text-red-600 dark:text-red-400">
                    {props.row.original.currentQuantity}
                </span>
            ),
        },
        {
            header: 'Umbral',
            accessorKey: 'threshold',
            cell: (props) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {props.row.original.threshold}
                </span>
            ),
        },
        {
            header: 'Almacén',
            accessorKey: 'warehouseId',
            cell: (props) => getWarehouseName(props.row.original.warehouseId),
        },
    ]

    if (data.length === 0 && !loading) {
        return <EmptyState className="!py-8" title={emptyMessage} />
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

export default StockAlertTab
