import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge, { ActiveBadge } from '@/components/shared/StatusBadge'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { useWarehousesList } from '@features/warehouses'
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'
import { useLocationsList, useLocationMutations } from '../hooks/useLocations'
import LocationForm from '../components/LocationForm'
import { LOCATION_TYPE_LABELS, type Location } from '../model/types'
import type { LocationFormValues } from '../model/location.schema'

const LocationsListPage = () => {
    const crud = useCrudOperations<Location>()
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useLocationsList({
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
                <StatusBadge tone="info">
                    {LOCATION_TYPE_LABELS[props.row.original.type] ||
                        props.row.original.type}
                </StatusBadge>
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
                <ActiveBadge active={props.row.original.isActive} />
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
                        aria-label="Editar"
                        icon={<HiOutlinePencil />}
                        onClick={() => crud.openEdit(props.row.original)}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label="Eliminar"
                        icon={<HiOutlineTrash />}
                        onClick={() => crud.openDelete(props.row.original)}
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Ubicaciones"
                description="Gestiona las ubicaciones dentro de los almacenes"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiPlus />}
                        onClick={crud.openCreate}
                    >
                        Nueva Ubicación
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={locations}
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
