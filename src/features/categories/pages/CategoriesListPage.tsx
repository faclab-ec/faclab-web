import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import { useCategoriesList, useCategoryMutations } from '../hooks/useCategories'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import { CategoryForm } from '../components/CategoryForm'
import type { Category } from '../model/types'
import type { CategoryFormValues } from '../model/category.schema'
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'

const CategoriesListPage = () => {
    const crud = useCrudOperations<Category>()
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useCategoriesList({
        limit: crud.pageSize,
        offset,
    })
    const categories = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { create, update, delete: remove } = useCategoryMutations()
    const isPending = create.isPending || update.isPending

    const handleFormSubmit = async (formData: CategoryFormValues) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: formData,
                })
                notifySuccess(
                    'Categoría actualizada',
                    'La categoría se actualizó correctamente'
                )
            } else {
                await create.mutateAsync(formData)
                notifySuccess(
                    'Categoría creada',
                    'La categoría se creó correctamente'
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar la categoría')
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            notifySuccess(
                'Categoría eliminada',
                'La categoría se eliminó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar la categoría')
        }
    }

    const columns: ColumnDef<Category>[] = [
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
            header: 'Descripción',
            accessorKey: 'description',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.description || '-'}
                </span>
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
                title="Categorías"
                description="Gestiona las categorías de productos"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiPlus />}
                        onClick={crud.openCreate}
                    >
                        Nueva Categoría
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={categories}
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
                formId="category-form"
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar Categoría' : 'Nueva Categoría'}
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <CategoryForm
                    formId="category-form"
                    category={crud.selectedItem}
                    isSubmitting={isPending}
                    onSubmit={handleFormSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={crud.selectedItem?.name}
                isDeleting={remove.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDeleteConfirm}
            />
        </>
    )
}

export default CategoriesListPage
