import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge, { ActiveBadge } from '@/components/shared/StatusBadge'
import {
    useWarehousesList,
    useWarehouseMutations,
} from '../hooks/useWarehouses'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import { WarehouseForm } from '../components/WarehouseForm'
import type { Warehouse } from '../model/types'
import type { WarehouseFormValues } from '../model/warehouse.schema'
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'

const WarehousesListPage = () => {
    const crud = useCrudOperations<Warehouse>()
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useWarehousesList({
        limit: crud.pageSize,
        offset,
    })
    const warehouses = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { create, update, delete: remove } = useWarehouseMutations()
    const isPending = create.isPending || update.isPending

    const handleFormSubmit = async (formData: WarehouseFormValues) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: formData,
                })
                notifySuccess(
                    'Bodega actualizada',
                    'La bodega se actualizó correctamente'
                )
            } else {
                await create.mutateAsync(formData)
                notifySuccess(
                    'Bodega creada',
                    'La bodega se creó correctamente'
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar la bodega')
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            notifySuccess(
                'Bodega eliminada',
                'La bodega se eliminó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar la bodega')
        }
    }

    const columns: ColumnDef<Warehouse>[] = [
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
            header: 'Ciudad',
            accessorKey: 'city',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.city || '-'}
                </span>
            ),
        },
        {
            header: 'Responsable',
            accessorKey: 'manager',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.manager || '-'}
                </span>
            ),
        },
        {
            header: 'Por defecto',
            accessorKey: 'isDefault',
            cell: (props) =>
                props.row.original.isDefault ? (
                    <StatusBadge tone="info">Por defecto</StatusBadge>
                ) : null,
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
                        aria-label={`Editar ${props.row.original.name}`}
                        icon={<HiOutlinePencil />}
                        onClick={() => crud.openEdit(props.row.original)}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={`Eliminar ${props.row.original.name}`}
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
                title="Almacenes"
                description="Gestiona los almacenes donde se guarda el inventario"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiPlus />}
                        onClick={crud.openCreate}
                    >
                        Nueva Bodega
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={warehouses}
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
                formId="warehouse-form"
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar Bodega' : 'Nueva Bodega'}
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <WarehouseForm
                    formId="warehouse-form"
                    warehouse={crud.selectedItem}
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
                isDeleting={remove.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDeleteConfirm}
            />
        </>
    )
}

export default WarehousesListPage
