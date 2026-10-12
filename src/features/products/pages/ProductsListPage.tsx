import { useState, useMemo } from 'react'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import { useProductsList, useProductMutations } from '../hooks/useProducts'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { useCategoriesList } from '@features/categories'
import { useUnitsOfMeasureList } from '@features/unitsOfMeasure'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import ListSearchInput from '@shared/ui/ListSearchInput'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import type { Product, ProductInput } from '../model/types'
import { ProductForm } from '../components/ProductForm'
import Select from '@/components/ui/Select'
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'
import StatusBadge, { ActiveBadge } from '@/components/shared/StatusBadge'
import { formatCurrency } from '@shared/lib/format'

const ProductsListPage = () => {
    const crud = useCrudOperations<Product>()
    const [filterCategoryId, setFilterCategoryId] = useState<
        number | undefined
    >(undefined)
    const [search, setSearch] = useState('')
    const searchTerm = useDebouncedValue(search.trim())
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useProductsList({
        limit: crud.pageSize,
        offset,
        categoryId: filterCategoryId,
        search: searchTerm || undefined,
    })
    const items = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { data: categoriesData } = useCategoriesList()
    const { data: unitsData } = useUnitsOfMeasureList()
    const {
        create: createProduct,
        update: updateProduct,
        delete: deleteProduct,
    } = useProductMutations()
    const isPending = createProduct.isPending || updateProduct.isPending

    const categoryMap = useMemo(() => {
        const categories = categoriesData?.items ?? []
        const map = new Map<number, string>()
        categories.forEach((cat) => map.set(cat.id, cat.name))
        return map
    }, [categoriesData])

    const categoryFilterOptions = useMemo(() => {
        const categories = categoriesData?.items ?? []
        return categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
        }))
    }, [categoriesData])

    const unitMap = useMemo(() => {
        const unitsOfMeasure = unitsData?.items ?? []
        const map = new Map<number, string>()
        unitsOfMeasure.forEach((u) => map.set(u.id, u.symbol))
        return map
    }, [unitsData])

    const handleFormSubmit = async (formData: ProductInput) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await updateProduct.mutateAsync({
                    id: crud.selectedItem.id,
                    data: formData,
                })
                notifySuccess(
                    'Producto actualizado',
                    'El producto se actualizó correctamente'
                )
            } else {
                await createProduct.mutateAsync(formData)
                notifySuccess(
                    'Producto creado',
                    'El producto se creó correctamente'
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar el producto')
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await deleteProduct.mutateAsync(crud.selectedItem.id)
            notifySuccess(
                'Producto eliminado',
                'El producto se eliminó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el producto')
        }
    }

    const columns: ColumnDef<Product>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => (
                <span className="font-medium">#{props.row.original.id}</span>
            ),
        },
        {
            header: 'SKU',
            accessorKey: 'sku',
            cell: (props) => (
                <span className="font-mono text-sm">
                    {props.row.original.sku}
                </span>
            ),
        },
        {
            header: 'Producto',
            accessorKey: 'name',
            cell: (props) => (
                <span className="font-semibold">{props.row.original.name}</span>
            ),
        },
        {
            header: 'Categoría',
            accessorKey: 'categoryId',
            cell: (props) => {
                const categoryName = props.row.original.categoryId
                    ? categoryMap.get(props.row.original.categoryId)
                    : null
                return categoryName ? (
                    <StatusBadge tone="info">{categoryName}</StatusBadge>
                ) : (
                    <span className="text-gray-400">Sin categoría</span>
                )
            },
        },
        {
            header: 'Unidad',
            accessorKey: 'unitOfMeasureId',
            cell: (props) => {
                const unitSymbol = props.row.original.unitOfMeasureId
                    ? unitMap.get(props.row.original.unitOfMeasureId)
                    : null
                return unitSymbol ? (
                    <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {unitSymbol}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            },
        },
        {
            header: 'Precio venta',
            accessorKey: 'salePrice',
            cell: (props) =>
                props.row.original.salePrice != null ? (
                    <span className="font-mono text-sm">
                        {formatCurrency(props.row.original.salePrice)}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
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
                title="Productos"
                description="Gestiona el catálogo de productos"
                actions={
                    <>
                        <ListSearchInput
                            placeholder="Buscar por nombre, SKU o código"
                            value={search}
                            onChange={(value) => {
                                setSearch(value)
                                crud.onPaginationChange(1, crud.pageSize)
                            }}
                        />
                        <Select
                            isClearable
                            size="sm"
                            className="min-w-[180px]"
                            placeholder="Todas las categorías"
                            options={categoryFilterOptions}
                            value={
                                categoryFilterOptions.find(
                                    (opt) => opt.value === filterCategoryId
                                ) || null
                            }
                            onChange={(option) => {
                                setFilterCategoryId(option?.value || undefined)
                                crud.onPaginationChange(1, crud.pageSize)
                            }}
                        />
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={crud.openCreate}
                        >
                            Nuevo Producto
                        </Button>
                    </>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={items}
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
                formId="product-form"
                width={640}
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar Producto' : 'Nuevo Producto'}
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <ProductForm
                    formId="product-form"
                    product={crud.selectedItem}
                    isSubmitting={isPending}
                    onSubmit={handleFormSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={crud.selectedItem?.name}
                isDeleting={deleteProduct.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDeleteConfirm}
            />
        </>
    )
}

export default ProductsListPage
