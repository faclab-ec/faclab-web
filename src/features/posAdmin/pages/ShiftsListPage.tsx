import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { HiOutlineEye } from 'react-icons/hi'
import { formatCurrency, formatDatetime } from '@shared/lib/format'
import {
    SHIFT_STATUS_CLASSES,
    SHIFT_STATUS_LABELS,
    useShifts,
    type Shift,
    type ShiftStatus,
} from '@features/pos'

const statusOptions = [
    { value: '', label: 'Todos' },
    ...Object.entries(SHIFT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const ShiftsListPage = () => {
    const navigate = useNavigate()
    const [statusFilter, setStatusFilter] = useState('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const { data, isLoading } = useShifts({
        status: (statusFilter as ShiftStatus) || undefined,
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize,
    })
    const shifts = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const columns: ColumnDef<Shift>[] = [
        {
            header: 'Turno',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        { header: 'Cajero', accessorKey: 'cashierName' },
        {
            header: 'Apertura',
            accessorKey: 'openedAt',
            cell: (props) => formatDatetime(props.row.original.openedAt),
        },
        {
            header: 'Cierre',
            accessorKey: 'closedAt',
            cell: (props) => {
                const closedAt = props.row.original.closedAt
                return closedAt ? formatDatetime(closedAt) : '-'
            },
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <Badge
                        content={SHIFT_STATUS_LABELS[status]}
                        className={SHIFT_STATUS_CLASSES[status]}
                    />
                )
            },
        },
        {
            header: 'Esperado en caja',
            accessorKey: 'expectedBalance',
            cell: (props) => {
                const expected = props.row.original.expectedBalance
                return expected != null ? formatCurrency(expected) : '-'
            },
        },
        {
            header: 'Diferencia',
            accessorKey: 'discrepancy',
            cell: (props) => {
                const discrepancy = props.row.original.discrepancy
                if (discrepancy == null) return '-'
                return (
                    <span
                        className={
                            discrepancy === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                        }
                    >
                        {formatCurrency(discrepancy)}
                    </span>
                )
            },
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    aria-label={`Ver turno ${props.row.original.id}`}
                    icon={<HiOutlineEye />}
                    onClick={() => navigate(`/shifts/${props.row.original.id}`)}
                />
            ),
        },
    ]

    return (
        <>
            <Card className="mb-4">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Estado
                        </label>
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
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-4">
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold">Turnos</h4>
                        <p className="text-sm text-gray-500 mt-1">
                            Historial de turnos de caja, del más reciente al más
                            antiguo
                        </p>
                    </div>
                    <DataTable
                        columns={columns}
                        data={shifts}
                        loading={isLoading}
                        pagingData={{ total, pageIndex, pageSize }}
                        onPaginationChange={setPageIndex}
                        onSelectChange={(size) => {
                            setPageSize(size)
                            setPageIndex(1)
                        }}
                    />
                </div>
            </Card>
        </>
    )
}

export default ShiftsListPage
