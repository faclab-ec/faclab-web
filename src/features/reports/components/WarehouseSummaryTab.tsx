import { useState } from 'react'
import Select from '@/components/ui/Select'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { formatCurrency } from '@shared/lib/format'
import { useWarehouseSummary } from '../hooks/useReports'
import type { WarehouseSummary } from '../model/types'
import LabeledField from '@/components/shared/LabeledField'

type Option = { value: string; label: string }

type Props = {
    warehouseOptions: Option[]
}

const WarehouseSummaryTab = ({ warehouseOptions }: Props) => {
    const [summaryWarehouse, setSummaryWarehouse] = useState('')

    const { data: summary = [], isLoading: loadingSummary } =
        useWarehouseSummary({
            warehouseId: summaryWarehouse
                ? parseInt(summaryWarehouse)
                : undefined,
        })

    const columns: ColumnDef<WarehouseSummary>[] = [
        {
            header: 'Almacén',
            accessorKey: 'warehouseName',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.warehouseName}
                </span>
            ),
        },
        {
            header: 'Código',
            accessorKey: 'warehouseCode',
            cell: (props) => (
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {props.row.original.warehouseCode}
                </span>
            ),
        },
        {
            header: 'Productos',
            accessorKey: 'totalProducts',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.totalProducts}
                </span>
            ),
        },
        {
            header: 'Cantidad Total',
            accessorKey: 'totalQuantity',
            cell: (props) => (
                <span className="font-medium">
                    {props.row.original.totalQuantity}
                </span>
            ),
        },
        {
            header: 'Reservado',
            accessorKey: 'reservedQuantity',
            cell: (props) => (
                <span className="text-amber-600 dark:text-amber-400">
                    {props.row.original.reservedQuantity}
                </span>
            ),
        },
        {
            header: 'Disponible',
            accessorKey: 'availableQuantity',
            cell: (props) => (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {props.row.original.availableQuantity}
                </span>
            ),
        },
        {
            header: 'Valor Total',
            accessorKey: 'totalValue',
            cell: (props) => (
                <span className="font-semibold">
                    {formatCurrency(props.row.original.totalValue)}
                </span>
            ),
        },
    ]

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <LabeledField label="Almacén">
                    <Select
                        placeholder="Todos los almacenes"
                        options={warehouseOptions}
                        value={warehouseOptions.find(
                            (o) => o.value === summaryWarehouse
                        )}
                        onChange={(option) =>
                            setSummaryWarehouse(option?.value || '')
                        }
                    />
                </LabeledField>
            </div>

            <DataTable
                columns={columns}
                data={summary}
                loading={loadingSummary}
                pagingData={{
                    total: summary.length,
                    pageIndex: 1,
                    pageSize: summary.length || 10,
                }}
            />
        </>
    )
}

export default WarehouseSummaryTab
