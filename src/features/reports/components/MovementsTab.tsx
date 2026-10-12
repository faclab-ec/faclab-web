import { useState } from 'react'
import StatusBadge from '@/components/shared/StatusBadge'
import Select from '@/components/ui/Select'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { formatDatetime } from '@shared/lib/format'
import { ProductSelect } from '@features/products'
import { useMovementHistory } from '../hooks/useReports'
import type { MovementHistoryItem, MovementHistoryParams } from '../model/types'
import LabeledField from '@/components/shared/LabeledField'
import Input from '@/components/ui/Input'

const movementTypeOptions = [
    { value: '', label: 'Todos' },
    { value: 'IN', label: 'Entrada' },
    { value: 'OUT', label: 'Salida' },
]

const referenceTypeLabels: Record<string, string> = {
    sale: 'Venta',
    purchase_order: 'Orden de Compra',
    adjustment: 'Ajuste',
    transfer: 'Transferencia',
}

type Option = { value: string; label: string }

type Props = {
    warehouseOptions: Option[]
}

const MovementsTab = ({ warehouseOptions }: Props) => {
    const [movWarehouse, setMovWarehouse] = useState('')
    const [movProduct, setMovProduct] = useState<number | null>(null)
    const [movType, setMovType] = useState('')
    const [movFromDate, setMovFromDate] = useState('')
    const [movToDate, setMovToDate] = useState('')
    const [movPageIndex, setMovPageIndex] = useState(1)
    const [movPageSize, setMovPageSize] = useState(50)

    const movOffset = (movPageIndex - 1) * movPageSize
    const movParams: MovementHistoryParams = {
        limit: movPageSize,
        offset: movOffset,
        warehouseId: movWarehouse ? parseInt(movWarehouse) : undefined,
        productId: movProduct ?? undefined,
        type: movType ? (movType as 'IN' | 'OUT') : undefined,
        fromDate: movFromDate || undefined,
        toDate: movToDate || undefined,
    }
    const { data: movData, isLoading: loadingMovements } =
        useMovementHistory(movParams)
    const movements = movData?.items ?? []
    const movTotal = movData?.pagination?.total ?? 0

    const columns: ColumnDef<MovementHistoryItem>[] = [
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
            header: 'Tipo',
            accessorKey: 'type',
            cell: (props) => {
                const type = props.row.original.type
                return (
                    <StatusBadge tone={type === 'IN' ? 'success' : 'danger'}>
                        {type === 'IN' ? 'Entrada' : 'Salida'}
                    </StatusBadge>
                )
            },
        },
        {
            header: 'Cantidad',
            accessorKey: 'quantity',
            cell: (props) => {
                const { type, quantity } = props.row.original
                return (
                    <span
                        className={
                            type === 'IN'
                                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-red-600 dark:text-red-400 font-medium'
                        }
                    >
                        {type === 'IN' ? '+' : '-'}
                        {Math.abs(quantity)}
                    </span>
                )
            },
        },
        {
            header: 'Referencia',
            accessorKey: 'referenceType',
            cell: (props) => {
                const { referenceType, referenceId } = props.row.original
                if (!referenceType)
                    return <span className="text-gray-400">-</span>
                return (
                    <span className="text-sm">
                        {referenceTypeLabels[referenceType] ?? referenceType}
                        {referenceId ? ` #${referenceId}` : ''}
                    </span>
                )
            },
        },
        {
            header: 'Razón',
            accessorKey: 'reason',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.reason ?? '-'}
                </span>
            ),
        },
        {
            header: 'Fecha',
            accessorKey: 'date',
            cell: (props) => {
                const date = props.row.original.date
                return (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {date ? formatDatetime(date) : '-'}
                    </span>
                )
            },
        },
    ]

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <LabeledField label="Almacén">
                    <Select
                        placeholder="Todos"
                        options={warehouseOptions}
                        value={warehouseOptions.find(
                            (o) => o.value === movWarehouse
                        )}
                        onChange={(option) => {
                            setMovWarehouse(option?.value || '')
                            setMovPageIndex(1)
                        }}
                    />
                </LabeledField>
                <LabeledField label="Producto">
                    <ProductSelect
                        isClearable
                        placeholder="Todos"
                        value={movProduct}
                        onChange={(id) => {
                            setMovProduct(id)
                            setMovPageIndex(1)
                        }}
                    />
                </LabeledField>
                <LabeledField label="Tipo">
                    <Select
                        placeholder="Todos"
                        options={movementTypeOptions}
                        value={movementTypeOptions.find(
                            (o) => o.value === movType
                        )}
                        onChange={(option) => {
                            setMovType(option?.value || '')
                            setMovPageIndex(1)
                        }}
                    />
                </LabeledField>
                <LabeledField label="Desde">
                    <Input
                        type="date"
                        value={movFromDate}
                        onChange={(e) => {
                            setMovFromDate(e.target.value)
                            setMovPageIndex(1)
                        }}
                    />
                </LabeledField>
                <LabeledField label="Hasta">
                    <Input
                        type="date"
                        value={movToDate}
                        onChange={(e) => {
                            setMovToDate(e.target.value)
                            setMovPageIndex(1)
                        }}
                    />
                </LabeledField>
            </div>

            <DataTable
                columns={columns}
                data={movements}
                loading={loadingMovements}
                pagingData={{
                    total: movTotal,
                    pageIndex: movPageIndex,
                    pageSize: movPageSize,
                }}
                onPaginationChange={setMovPageIndex}
                onSelectChange={(size) => {
                    setMovPageSize(size)
                    setMovPageIndex(1)
                }}
            />
        </>
    )
}

export default MovementsTab
