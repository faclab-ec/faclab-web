import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Select from '@/components/ui/Select'
import { useAdjustmentsList } from '../hooks/useAdjustments'
import { useWarehousesList } from '@features/warehouses'
import {
    ADJUSTMENT_STATUS_LABELS,
    ADJUSTMENT_STATUS_TONES,
    ADJUSTMENT_REASON_LABELS,
    type Adjustment,
    type AdjustmentListParams,
    type AdjustmentStatus,
} from '../model/types'
import AdjustmentForm from '../components/AdjustmentForm'
import { HiPlus, HiOutlineEye } from 'react-icons/hi'
import { formatDate } from '@shared/lib/format'
import LabeledField from '@/components/shared/LabeledField'

const statusOptions = [
    { value: '', label: 'Todos' },
    ...Object.entries(ADJUSTMENT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const AdjustmentsListPage = () => {
    const navigate = useNavigate()
    const [isFormOpen, setIsFormOpen] = useState(false)

    const [statusFilter, setStatusFilter] = useState<string>('')
    const [warehouseFilter, setWarehouseFilter] = useState<string>('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const offset = (pageIndex - 1) * pageSize

    const { data: warehousesData } = useWarehousesList({ limit: 100 })
    const warehouses = warehousesData?.items ?? []

    const warehouseOptions = [
        { value: '', label: 'Todos' },
        ...warehouses.map((w) => ({
            value: w.id.toString(),
            label: `${w.name} (${w.code})`,
        })),
    ]

    const queryParams: AdjustmentListParams = {
        status: statusFilter ? (statusFilter as AdjustmentStatus) : undefined,
        warehouseId: warehouseFilter ? parseInt(warehouseFilter) : undefined,
        limit: pageSize,
        offset,
    }

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useAdjustmentsList(queryParams)
    const adjustments = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const handleReset = () => {
        setStatusFilter('')
        setWarehouseFilter('')
        setPageIndex(1)
    }

    const getWarehouseName = (warehouseId: number) => {
        const warehouse = warehouses.find((w) => w.id === warehouseId)
        return warehouse ? `${warehouse.name}` : `#${warehouseId}`
    }

    const handleCreated = (id: number) => {
        navigate(`/adjustments/${id}`)
    }

    const columns: ColumnDef<Adjustment>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'Almacén',
            accessorKey: 'warehouseId',
            cell: (props) => getWarehouseName(props.row.original.warehouseId),
        },
        {
            header: 'Motivo',
            accessorKey: 'reason',
            cell: (props) =>
                ADJUSTMENT_REASON_LABELS[props.row.original.reason] ||
                props.row.original.reason,
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <StatusBadge tone={ADJUSTMENT_STATUS_TONES[status]}>
                        {ADJUSTMENT_STATUS_LABELS[status]}
                    </StatusBadge>
                )
            },
        },
        {
            header: 'Fecha',
            accessorKey: 'createdAt',
            cell: (props) => {
                const date = props.row.original.createdAt
                return (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {date ? formatDate(date) : '-'}
                    </span>
                )
            },
        },
        {
            header: 'Responsable',
            accessorKey: 'adjustedBy',
            cell: (props) => props.row.original.adjustedBy || '-',
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    aria-label="Ver detalle"
                    icon={<HiOutlineEye />}
                    onClick={() =>
                        navigate(`/adjustments/${props.row.original.id}`)
                    }
                />
            ),
        },
    ]

    return (
        <>
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="Estado">
                        <Select
                            placeholder="Filtrar por estado"
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
                    <LabeledField label="Almacén">
                        <Select
                            placeholder="Filtrar por almacén"
                            options={warehouseOptions}
                            value={warehouseOptions.find(
                                (o) => o.value === warehouseFilter
                            )}
                            onChange={(option) => {
                                setWarehouseFilter(option?.value || '')
                                setPageIndex(1)
                            }}
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
                title="Ajustes de Inventario"
                description="Gestiona los ajustes de inventario"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiPlus />}
                        onClick={() => setIsFormOpen(true)}
                    >
                        Nuevo Ajuste
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={adjustments}
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

            <AdjustmentForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onCreated={handleCreated}
            />
        </>
    )
}

export default AdjustmentsListPage
