import { useState } from 'react'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { useLotsList, useLotMutations } from '../hooks/useLots'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { FormModal } from '@/components/shared'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import type {
    Lot,
    LotInput,
    LotUpdateInput,
    LotListParams,
} from '../model/types'
import { LotForm } from '../components/LotForm'
import { HiOutlinePencil, HiPlus } from 'react-icons/hi'

const LotsListPage = () => {
    const crud = useCrudOperations<Lot>()

    const [productId, setProductId] = useState<string>('')
    const [expiringInDays, setExpiringInDays] = useState<string>('')
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const queryParams: LotListParams = {
        productId: productId ? parseInt(productId) : undefined,
        expiringInDays: expiringInDays ? parseInt(expiringInDays) : undefined,
        limit: crud.pageSize,
        offset,
    }

    const { data, isLoading } = useLotsList(queryParams)
    const lots = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { create: createLot, update: updateLot } = useLotMutations()
    const isPending = createLot.isPending || updateLot.isPending

    const handleFormSubmit = async (data: LotInput | LotUpdateInput) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await updateLot.mutateAsync({
                    id: crud.selectedItem.id,
                    data: data as LotUpdateInput,
                })
                notifySuccess(
                    'Lote actualizado',
                    'El lote se actualizó correctamente'
                )
            } else {
                await createLot.mutateAsync(data as LotInput)
                notifySuccess('Lote creado', 'El lote se creó correctamente')
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar el lote')
        }
    }

    const handleReset = () => {
        setProductId('')
        setExpiringInDays('')
        crud.onPaginationChange(1, crud.pageSize)
    }

    const getExpiryBadge = (lot: Lot) => {
        if (lot.isExpired) {
            return (
                <Badge
                    content="Expirado"
                    className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                />
            )
        }
        if (
            lot.daysToExpiry !== null &&
            lot.daysToExpiry !== undefined &&
            lot.daysToExpiry <= 30
        ) {
            return (
                <Badge
                    content={`${lot.daysToExpiry} días`}
                    className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                />
            )
        }
        if (lot.expirationDate) {
            return (
                <Badge
                    content="Vigente"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                />
            )
        }
        return (
            <span className="text-gray-400 italic text-sm">
                Sin vencimiento
            </span>
        )
    }

    const columns: ColumnDef<Lot>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'Número de Lote',
            accessorKey: 'lotNumber',
            cell: (props) => (
                <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {props.row.original.lotNumber}
                </span>
            ),
        },
        {
            header: 'Producto ID',
            accessorKey: 'productId',
        },
        {
            header: 'Cant. Inicial',
            accessorKey: 'initialQuantity',
            cell: (props) => (
                <span className="text-sm">
                    {props.row.original.initialQuantity}
                </span>
            ),
        },
        {
            header: 'Cant. Actual',
            accessorKey: 'currentQuantity',
            cell: (props) => {
                const { currentQuantity, initialQuantity } = props.row.original
                return (
                    <span
                        className={`font-semibold ${
                            currentQuantity === 0
                                ? 'text-red-600'
                                : currentQuantity < initialQuantity * 0.2
                                ? 'text-yellow-600'
                                : 'text-green-600'
                        }`}
                    >
                        {currentQuantity}
                    </span>
                )
            },
        },
        {
            header: 'F. Manufactura',
            accessorKey: 'manufactureDate',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.manufactureDate || '-'}
                </span>
            ),
        },
        {
            header: 'F. Vencimiento',
            accessorKey: 'expirationDate',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.expirationDate || '-'}
                </span>
            ),
        },
        {
            header: 'Estado',
            id: 'status',
            cell: (props) => getExpiryBadge(props.row.original),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    icon={<HiOutlinePencil />}
                    onClick={() => crud.openEdit(props.row.original)}
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
                                Por vencer en (días)
                            </label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="Ej: 30"
                                value={expiringInDays}
                                onChange={(e) =>
                                    setExpiringInDays(e.target.value)
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
                            <h4 className="text-lg font-semibold">Lotes</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Gestiona los lotes de productos
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={crud.openCreate}
                        >
                            Nuevo Lote
                        </Button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={lots}
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
                formId="lot-form"
                width={600}
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar Lote' : 'Nuevo Lote'}
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <LotForm
                    formId="lot-form"
                    lot={crud.selectedItem}
                    isSubmitting={isPending}
                    onSubmit={handleFormSubmit}
                />
            </FormModal>
        </>
    )
}

export default LotsListPage
