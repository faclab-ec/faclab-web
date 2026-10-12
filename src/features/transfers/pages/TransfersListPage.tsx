import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Select from '@/components/ui/Select'
import { useTransfersList } from '../hooks/useTransfers'
import { useLocationsList } from '@features/locations'
import {
    TRANSFER_STATUS_LABELS,
    TRANSFER_STATUS_TONES,
    type Transfer,
    type TransferListParams,
    type TransferStatus,
} from '../model/types'
import TransferForm from '../components/TransferForm'
import { HiPlus, HiOutlineEye } from 'react-icons/hi'
import { formatDate } from '@shared/lib/format'
import LabeledField from '@/components/shared/LabeledField'

const statusOptions = [
    { value: '', label: 'Todos' },
    ...Object.entries(TRANSFER_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const TransfersListPage = () => {
    const navigate = useNavigate()
    const [isFormOpen, setIsFormOpen] = useState(false)

    const [statusFilter, setStatusFilter] = useState<string>('')
    const [sourceLocationFilter, setSourceLocationFilter] = useState<string>('')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const offset = (pageIndex - 1) * pageSize

    const { data: locationsData } = useLocationsList({ limit: 100 })
    const locations = locationsData?.items ?? []

    const locationOptions = [
        { value: '', label: 'Todos' },
        ...locations.map((l) => ({
            value: l.id.toString(),
            label: `${l.name} (${l.code})`,
        })),
    ]

    const queryParams: TransferListParams = {
        status: statusFilter ? (statusFilter as TransferStatus) : undefined,
        sourceLocationId: sourceLocationFilter
            ? parseInt(sourceLocationFilter)
            : undefined,
        limit: pageSize,
        offset,
    }

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useTransfersList(queryParams)
    const transfers = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const handleReset = () => {
        setStatusFilter('')
        setSourceLocationFilter('')
        setPageIndex(1)
    }

    const getLocationName = (locationId: number) => {
        const location = locations.find((l) => l.id === locationId)
        return location
            ? `${location.name} (${location.code})`
            : `#${locationId}`
    }

    const handleCreated = (id: number) => {
        navigate(`/transfers/${id}`)
    }

    const columns: ColumnDef<Transfer>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'Origen',
            accessorKey: 'sourceLocationId',
            cell: (props) =>
                getLocationName(props.row.original.sourceLocationId),
        },
        {
            header: 'Destino',
            accessorKey: 'destinationLocationId',
            cell: (props) =>
                getLocationName(props.row.original.destinationLocationId),
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <StatusBadge tone={TRANSFER_STATUS_TONES[status]}>
                        {TRANSFER_STATUS_LABELS[status]}
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
            header: 'Solicitado por',
            accessorKey: 'requestedBy',
            cell: (props) => props.row.original.requestedBy || '-',
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
                        navigate(`/transfers/${props.row.original.id}`)
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
                    <LabeledField label="Ubicación Origen">
                        <Select
                            placeholder="Filtrar por ubicación origen"
                            options={locationOptions}
                            value={locationOptions.find(
                                (o) => o.value === sourceLocationFilter
                            )}
                            onChange={(option) => {
                                setSourceLocationFilter(option?.value || '')
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
                title="Transferencias de Inventario"
                description="Gestiona las transferencias entre ubicaciones"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiPlus />}
                        onClick={() => setIsFormOpen(true)}
                    >
                        Nueva Transferencia
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={transfers}
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

            <TransferForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onCreated={handleCreated}
            />
        </>
    )
}

export default TransfersListPage
