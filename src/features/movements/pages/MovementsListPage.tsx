import { useState } from 'react'
import { useMovementsList } from '../hooks/useMovements'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import type { Movement } from '../model/types'
import MovementForm from '../components/MovementForm'
import { HiOutlinePlus } from 'react-icons/hi'
import { formatDatetime } from '@shared/lib/format'
import LabeledField from '@/components/shared/LabeledField'
import StatusBadge from '@/components/shared/StatusBadge'

const MovementsListPage = () => {
    const [productId, setProductId] = useState<string>('')
    const [type, setType] = useState<string>('')
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')
    const [formOpen, setFormOpen] = useState(false)

    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const offset = (pageIndex - 1) * pageSize

    const queryParams = {
        productId: productId ? parseInt(productId) : undefined,
        type: type ? (type as 'IN' | 'OUT') : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: pageSize,
        offset,
    }

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useMovementsList(queryParams)
    const movements = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const columns: ColumnDef<Movement>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => {
                const { row } = props
                return <span className="font-medium">#{row.original.id}</span>
            },
        },
        {
            header: 'ID Producto',
            accessorKey: 'productId',
        },
        {
            header: 'Tipo',
            accessorKey: 'type',
            cell: ({ row }) => {
                const type = row.original.type
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
            cell: ({ row }) => {
                const quantity = row.original.quantity
                return (
                    <span
                        className={
                            quantity > 0
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                        }
                    >
                        {quantity > 0 ? '+' : ''}
                        {quantity}
                    </span>
                )
            },
        },
        {
            header: 'Motivo',
            accessorKey: 'reason',
            cell: ({ row }) =>
                row.original.reason || (
                    <span className="text-gray-400 italic">Sin motivo</span>
                ),
        },
        {
            header: 'Fecha',
            accessorKey: 'date',
            cell: ({ row }) => {
                const date = row.original.date
                if (!date) return '-'
                return formatDatetime(date)
            },
        },
    ]

    const handleReset = () => {
        setProductId('')
        setType('')
        setFromDate('')
        setToDate('')
        setPageIndex(1)
    }

    const typeOptions = [
        { value: '', label: 'Todos' },
        { value: 'IN', label: 'Entrada' },
        { value: 'OUT', label: 'Salida' },
    ]

    return (
        <>
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <LabeledField label="ID Producto">
                        <Input
                            type="number"
                            placeholder="Filtrar por producto"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                    </LabeledField>
                    <LabeledField label="Tipo">
                        <Select
                            value={typeOptions.find(
                                (opt) => opt.value === type
                            )}
                            options={typeOptions}
                            onChange={(option) => setType(option?.value || '')}
                        />
                    </LabeledField>
                    <LabeledField label="Desde">
                        <Input
                            type="datetime-local"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </LabeledField>
                    <LabeledField label="Hasta">
                        <Input
                            type="datetime-local"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </LabeledField>
                    <div className="flex items-end">
                        <Button variant="plain" onClick={handleReset}>
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </Card>

            <PageHeader
                title="Movimientos"
                description="Gestiona los movimientos de inventario"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={() => setFormOpen(true)}
                    >
                        Nuevo Movimiento
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={movements}
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

            <MovementForm open={formOpen} onClose={() => setFormOpen(false)} />
        </>
    )
}

export default MovementsListPage
