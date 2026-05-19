import { useState } from 'react'
import Select from '@/components/ui/Select'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { formatCurrency, formatDate } from '@shared/lib/format'
import { useValuation } from '../hooks/useReports'
import type { ValuationItem } from '../model/types'

type Option = { value: string; label: string }

type Props = {
    warehouseOptions: Option[]
}

const ValuationTab = ({ warehouseOptions }: Props) => {
    const [valuationWarehouse, setValuationWarehouse] = useState('')
    const [valuationDate, setValuationDate] = useState('')

    const { data: valuation, isLoading: loadingValuation } = useValuation({
        warehouseId: valuationWarehouse
            ? parseInt(valuationWarehouse)
            : undefined,
        asOfDate: valuationDate || undefined,
    })

    const columns: ColumnDef<ValuationItem>[] = [
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
            header: 'Cantidad',
            accessorKey: 'quantity',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.quantity}
                </span>
            ),
        },
        {
            header: 'Costo Promedio',
            accessorKey: 'averageCost',
            cell: (props) => formatCurrency(props.row.original.averageCost),
        },
        {
            header: 'Valor Total',
            accessorKey: 'totalValue',
            cell: (props) => (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(props.row.original.totalValue)}
                </span>
            ),
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
                            (o) => o.value === valuationWarehouse
                        )}
                        onChange={(option) =>
                            setValuationWarehouse(option?.value || '')
                        }
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Fecha histórica
                    </label>
                    <input
                        type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        value={valuationDate}
                        onChange={(e) => setValuationDate(e.target.value)}
                    />
                </div>
            </div>

            {valuation && (
                <div className="flex items-center justify-between mb-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Valor Total del Inventario
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Al {formatDate(valuation.asOfDate)}
                        </p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(valuation.totalValue)}
                    </p>
                </div>
            )}

            <DataTable
                columns={columns}
                data={valuation?.items ?? []}
                loading={loadingValuation}
                pagingData={{
                    total: valuation?.items?.length ?? 0,
                    pageIndex: 1,
                    pageSize: valuation?.items?.length || 10,
                }}
            />
        </>
    )
}

export default ValuationTab
