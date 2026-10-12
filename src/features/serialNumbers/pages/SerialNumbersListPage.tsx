import { useState } from 'react'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
    useSerialNumbersList,
    useSerialNumberMutations,
} from '../hooks/useSerialNumbers'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { FormModal } from '@/components/shared'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import {
    SERIAL_STATUS_LABELS,
    SERIAL_STATUS_TONES,
    type SerialNumber,
    type SerialStatus,
    type SerialNumberListParams,
    type SerialNumberInput,
} from '../model/types'
import { SerialNumberForm } from '../components/SerialNumberForm'
import { StatusChangeDialog } from '../components/StatusChangeDialog'
import { HiOutlineRefresh, HiPlus } from 'react-icons/hi'
import LabeledField from '@/components/shared/LabeledField'

const statusFilterOptions = [
    { value: '', label: 'Todos los estados' },
    ...(Object.keys(SERIAL_STATUS_LABELS) as SerialStatus[]).map((key) => ({
        value: key,
        label: SERIAL_STATUS_LABELS[key],
    })),
]

const SerialNumbersListPage = () => {
    const crud = useCrudOperations<SerialNumber>()
    const [statusChangeSerial, setStatusChangeSerial] =
        useState<SerialNumber | null>(null)
    const [statusChangeOpen, setStatusChangeOpen] = useState(false)

    const [productId, setProductId] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const queryParams: SerialNumberListParams = {
        productId: productId ? parseInt(productId) : undefined,
        status: (statusFilter as SerialStatus) || undefined,
        limit: crud.pageSize,
        offset,
    }

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useSerialNumbersList(queryParams)
    const serials = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { create: createSerialNumber } = useSerialNumberMutations()

    const handleFormSubmit = async (data: SerialNumberInput) => {
        try {
            await createSerialNumber.mutateAsync(data)
            notifySuccess(
                'Número de serie creado',
                'El número de serie se creó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al crear el número de serie')
        }
    }

    const handleStatusChange = (serial: SerialNumber) => {
        setStatusChangeSerial(serial)
        setStatusChangeOpen(true)
    }

    const handleStatusChangeClose = () => {
        setStatusChangeOpen(false)
        setStatusChangeSerial(null)
    }

    const handleReset = () => {
        setProductId('')
        setStatusFilter('')
        crud.onPaginationChange(1, crud.pageSize)
    }

    const columns: ColumnDef<SerialNumber>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'Número de Serie',
            accessorKey: 'serialNumber',
            cell: (props) => (
                <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {props.row.original.serialNumber}
                </span>
            ),
        },
        {
            header: 'Producto ID',
            accessorKey: 'productId',
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => {
                const status = props.row.original.status
                return (
                    <StatusBadge tone={SERIAL_STATUS_TONES[status]}>
                        {SERIAL_STATUS_LABELS[status]}
                    </StatusBadge>
                )
            },
        },
        {
            header: 'Lote ID',
            accessorKey: 'lotId',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.lotId || '-'}
                </span>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    title="Cambiar estado"
                    icon={<HiOutlineRefresh />}
                    onClick={() => handleStatusChange(props.row.original)}
                />
            ),
        },
    ]

    return (
        <>
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="ID Producto">
                        <Input
                            type="number"
                            placeholder="Filtrar por producto"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                    </LabeledField>
                    <LabeledField label="Estado">
                        <Select
                            options={statusFilterOptions}
                            value={statusFilterOptions.find(
                                (o) => o.value === statusFilter
                            )}
                            onChange={(option) =>
                                setStatusFilter(
                                    (option as { value: string })?.value || ''
                                )
                            }
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
                title="Números de Serie"
                description="Gestiona los números de serie de productos"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiPlus />}
                        onClick={crud.openCreate}
                    >
                        Nuevo Serial
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={serials}
                    loading={isLoading}
                    error={listError}
                    pagingData={{
                        total,
                        pageIndex: crud.pageIndex,
                        pageSize: crud.pageSize,
                    }}
                    onRetry={refetch}
                    onPaginationChange={(idx) =>
                        crud.onPaginationChange(idx, crud.pageSize)
                    }
                    onSelectChange={(size) => crud.onPaginationChange(1, size)}
                />
            </Card>

            <FormModal
                formId="serial-form"
                isOpen={crud.isCreateOpen}
                title="Nuevo Número de Serie"
                isSubmitting={createSerialNumber.isPending}
                onClose={crud.closeAll}
            >
                <SerialNumberForm
                    formId="serial-form"
                    isSubmitting={createSerialNumber.isPending}
                    onSubmit={handleFormSubmit}
                />
            </FormModal>

            <StatusChangeDialog
                open={statusChangeOpen}
                serialNumber={statusChangeSerial}
                onClose={handleStatusChangeClose}
            />
        </>
    )
}

export default SerialNumbersListPage
