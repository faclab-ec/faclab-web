import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Select from '@/components/ui/Select'
import { HiOutlineEye } from 'react-icons/hi'
import { formatCurrency, formatDatetime } from '@shared/lib/format'
import {
    SHIFT_STATUS_TONES,
    SHIFT_STATUS_LABELS,
    useShifts,
    type Shift,
    type ShiftStatus,
} from '@features/pos'
import LabeledField from '@/components/shared/LabeledField'
import PageHeader from '@/components/shared/PageHeader'

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

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useShifts({
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
                    <StatusBadge tone={SHIFT_STATUS_TONES[status]}>
                        {SHIFT_STATUS_LABELS[status]}
                    </StatusBadge>
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
            <PageHeader
                title="Turnos"
                description="Historial de turnos de caja, del más reciente al más antiguo"
            />
            <Card className="mb-4">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="Estado">
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
                    </LabeledField>
                </div>
            </Card>

            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={shifts}
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
        </>
    )
}

export default ShiftsListPage
