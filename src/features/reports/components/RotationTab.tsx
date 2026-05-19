import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { useRotation } from '../hooks/useReports'
import type { ProductRotation } from '../model/types'

type Option = { value: string; label: string }

type Props = {
    warehouseOptions: Option[]
}

const RotationTab = ({ warehouseOptions }: Props) => {
    const [rotationWarehouse, setRotationWarehouse] = useState('')
    const [rotationFromDate, setRotationFromDate] = useState('')
    const [rotationToDate, setRotationToDate] = useState('')

    const { data: rotation = [], isLoading: loadingRotation } = useRotation({
        warehouseId: rotationWarehouse
            ? parseInt(rotationWarehouse)
            : undefined,
        fromDate: rotationFromDate || undefined,
        toDate: rotationToDate || undefined,
    })

    const columns: ColumnDef<ProductRotation>[] = [
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
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {props.row.original.sku}
                </span>
            ),
        },
        {
            header: 'Entradas',
            accessorKey: 'totalIn',
            cell: (props) => (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    +{props.row.original.totalIn}
                </span>
            ),
        },
        {
            header: 'Salidas',
            accessorKey: 'totalOut',
            cell: (props) => (
                <span className="text-red-600 dark:text-red-400 font-medium">
                    -{props.row.original.totalOut}
                </span>
            ),
        },
        {
            header: 'Stock Actual',
            accessorKey: 'currentStock',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.currentStock}
                </span>
            ),
        },
        {
            header: 'Tasa de Rotación',
            accessorKey: 'turnoverRate',
            cell: (props) => {
                const rate = props.row.original.turnoverRate
                const isHigh = rate >= 2
                const isMed = rate >= 1
                return (
                    <Badge
                        content={rate.toFixed(2)}
                        className={
                            isHigh
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : isMed
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                        }
                    />
                )
            },
        },
        {
            header: 'Días de Stock',
            accessorKey: 'daysOfStock',
            cell: (props) => {
                const d = props.row.original.daysOfStock
                if (d === null) return <span className="text-gray-400">-</span>
                const isLow = d <= 7
                return (
                    <span
                        className={
                            isLow
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                        }
                    >
                        {d} días
                    </span>
                )
            },
        },
    ]

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Almacén
                    </label>
                    <Select
                        placeholder="Todos los almacenes"
                        options={warehouseOptions}
                        value={warehouseOptions.find(
                            (o) => o.value === rotationWarehouse
                        )}
                        onChange={(option) =>
                            setRotationWarehouse(option?.value || '')
                        }
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Desde
                    </label>
                    <input
                        type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        value={rotationFromDate}
                        onChange={(e) => setRotationFromDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Hasta
                    </label>
                    <input
                        type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        value={rotationToDate}
                        onChange={(e) => setRotationToDate(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={rotation}
                loading={loadingRotation}
                pagingData={{
                    total: rotation.length,
                    pageIndex: 1,
                    pageSize: rotation.length || 10,
                }}
            />
        </>
    )
}

export default RotationTab
