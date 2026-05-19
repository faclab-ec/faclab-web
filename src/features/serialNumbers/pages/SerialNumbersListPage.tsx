import { useState } from 'react'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
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
    type SerialNumber,
    type SerialStatus,
    type SerialNumberListParams,
    type SerialNumberInput,
} from '../model/types'
import { SerialNumberForm } from '../components/SerialNumberForm'
import { StatusChangeDialog } from '../components/StatusChangeDialog'
import { HiOutlineRefresh, HiPlus } from 'react-icons/hi'

const STATUS_BADGE_CLASSES: Record<SerialStatus, string> = {
    available:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    reserved:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
    sold: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    returned:
        'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    scrapped: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

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

    const { data, isLoading } = useSerialNumbersList(queryParams)
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
                    <Badge
                        content={SERIAL_STATUS_LABELS[status]}
                        className={STATUS_BADGE_CLASSES[status]}
                    />
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
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                ID Producto
                            </label>
                            <Input
                                type="number"
                                placeholder="Filtrar por producto"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Estado
                            </label>
                            <Select
                                options={statusFilterOptions}
                                value={statusFilterOptions.find(
                                    (o) => o.value === statusFilter
                                )}
                                onChange={(option) =>
                                    setStatusFilter(
                                        (option as { value: string })?.value ||
                                            ''
                                    )
                                }
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="plain" onClick={handleReset}>
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-lg font-semibold">
                                Números de Serie
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Gestiona los números de serie de productos
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={crud.openCreate}
                        >
                            Nuevo Serial
                        </Button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={serials}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: crud.pageIndex,
                            pageSize: crud.pageSize,
                        }}
                        onPaginationChange={(idx) =>
                            crud.onPaginationChange(idx, crud.pageSize)
                        }
                        onSelectChange={(size) =>
                            crud.onPaginationChange(1, size)
                        }
                    />
                </div>
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
