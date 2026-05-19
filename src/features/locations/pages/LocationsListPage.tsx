import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { useWarehousesList } from '@features/warehouses'
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'
import { useLocationsList, useLocationMutations } from '../hooks/useLocations'
import LocationForm from '../components/LocationForm'
import type { Location } from '../model/types'
import type { LocationFormValues } from '../model/location.schema'

const LOCATION_TYPE_LABELS: Record<string, string> = {
    STORAGE: 'Almacenamiento',
    RECEIVING: 'Recepción',
    SHIPPING: 'Despacho',
    RETURN: 'Devolución',
}

const LocationsListPage = () => {
    const crud = useCrudOperations<Location>()
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const { data, isLoading } = useLocationsList({
        limit: crud.pageSize,
        offset,
    })
    const locations = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { data: warehousesData } = useWarehousesList()
    const warehouses = warehousesData?.items ?? []
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]))

    const mutations = useLocationMutations()
    const isPending = mutations.create.isPending || mutations.update.isPending

    const handleFormSubmit = async (formData: LocationFormValues) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await mutations.update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: formData,
                })
                notifySuccess(
                    'Ubicación actualizada',
                    'La ubicación se actualizó correctamente'
                )
            } else {
                await mutations.create.mutateAsync(formData)
                notifySuccess(
                    'Ubicación creada',
                    'La ubicación se creó correctamente'
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar la ubicación')
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await mutations.delete.mutateAsync(crud.selectedItem.id)
            notifySuccess(
                'Ubicación eliminada',
                'La ubicación se eliminó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar la ubicación')
        }
    }

    const columns: ColumnDef<Location>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'Nombre',
            accessorKey: 'name',
            cell: (props) => (
                <span className="font-semibold">{props.row.original.name}</span>
            ),
        },
        {
            header: 'Código',
            accessorKey: 'code',
            cell: (props) => (
                <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {props.row.original.code}
                </span>
            ),
        },
        {
            header: 'Bodega',
            accessorKey: 'warehouseId',
            cell: (props) => (
                <span className="text-sm">
                    {warehouseMap.get(props.row.original.warehouseId) || '-'}
                </span>
            ),
        },
        {
            header: 'Tipo',
            accessorKey: 'type',
            cell: (props) => (
                <Badge
                    content={
                        LOCATION_TYPE_LABELS[props.row.original.type] ||
                        props.row.original.type
                    }
                    className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                />
            ),
        },
        {
            header: 'Capacidad',
            accessorKey: 'capacity',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.capacity != null
                        ? props.row.original.capacity
                        : '-'}
                </span>
            ),
        },
        {
            header: 'Estado',
            accessorKey: 'isActive',
            cell: (props) => (
                <Badge
                    content={
                        props.row.original.isActive ? 'Activo' : 'Inactivo'
                    }
                    className={
                        props.row.original.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                    }
                />
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlinePencil />}
                        onClick={() => crud.openEdit(props.row.original)}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineTrash />}
                        onClick={() => crud.openDelete(props.row.original)}
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <Card>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-lg font-semibold">
                                Ubicaciones
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Gestiona las ubicaciones dentro de las bodegas
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={crud.openCreate}
                        >
                            Nueva Ubicación
                        </Button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={locations}
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
                formId="location-form"
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar Ubicación' : 'Nueva Ubicación'}
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <LocationForm
                    formId="location-form"
                    location={crud.selectedItem}
                    isSubmitting={isPending}
                    onSubmit={handleFormSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={
                    crud.selectedItem
                        ? `${crud.selectedItem.name} (${crud.selectedItem.code})`
                        : undefined
                }
                isDeleting={mutations.delete.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDeleteConfirm}
            />
        </>
    )
}

export default LocationsListPage
