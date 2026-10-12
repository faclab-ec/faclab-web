import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'
import {
    useUnitsOfMeasureList,
    useUnitOfMeasureMutations,
} from '../hooks/useUnitsOfMeasure'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import type { UnitOfMeasure, UnitOfMeasureInput } from '../model/types'
import type { UnitOfMeasureFormValues } from '../model/unitOfMeasure.schema'
import { UnitOfMeasureForm } from '../components/UnitOfMeasureForm'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'

const UnitsOfMeasureListPage = () => {
    const crud = useCrudOperations<UnitOfMeasure>()
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useUnitsOfMeasureList({
        limit: crud.pageSize,
        offset,
    })
    const units = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { create, update, delete: remove } = useUnitOfMeasureMutations()
    const isPending = create.isPending || update.isPending

    const handleFormSubmit = async (formData: UnitOfMeasureFormValues) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: formData as UnitOfMeasureInput,
                })
                notifySuccess(
                    'Unidad actualizada',
                    'La unidad de medida se actualizó correctamente'
                )
            } else {
                await create.mutateAsync(formData as UnitOfMeasureInput)
                notifySuccess(
                    'Unidad creada',
                    'La unidad de medida se creó correctamente'
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar la unidad de medida')
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            notifySuccess(
                'Unidad eliminada',
                'La unidad de medida se eliminó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar la unidad de medida')
        }
    }

    const columns: ColumnDef<UnitOfMeasure>[] = [
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
            header: 'Símbolo',
            accessorKey: 'symbol',
            cell: (props) => (
                <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {props.row.original.symbol}
                </span>
            ),
        },
        {
            header: 'Descripción',
            accessorKey: 'description',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.description || '-'}
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
                title="Unidades de Medida"
                description="Gestiona las unidades de medida de los productos"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiPlus />}
                        onClick={crud.openCreate}
                    >
                        Nueva Unidad
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={units}
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
                formId="unit-of-measure-form"
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={
                    crud.isEditOpen
                        ? 'Editar Unidad de Medida'
                        : 'Nueva Unidad de Medida'
                }
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <UnitOfMeasureForm
                    formId="unit-of-measure-form"
                    unitOfMeasure={crud.selectedItem}
                    isSubmitting={isPending}
                    onSubmit={handleFormSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={
                    crud.selectedItem
                        ? `${crud.selectedItem.name} (${crud.selectedItem.symbol})`
                        : undefined
                }
                isDeleting={remove.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDeleteConfirm}
            />
        </>
    )
}

export default UnitsOfMeasureListPage
