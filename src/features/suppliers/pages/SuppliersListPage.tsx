import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import { notifySuccess, notifyInfo, notifyError } from '@shared/ui/notify'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import ListSearchInput from '@shared/ui/ListSearchInput'
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineEye,
} from 'react-icons/hi'
import { useSuppliersList, useSupplierMutations } from '../hooks/useSuppliers'
import SupplierForm from '../components/SupplierForm'
import type { Supplier } from '../model/types'
import { TAX_TYPE_LABELS } from '../model/types'
import type { SupplierFormValues } from '../model/supplier.schema'

const SuppliersListPage = () => {
    const navigate = useNavigate()
    const crud = useCrudOperations<Supplier>()
    const [search, setSearch] = useState('')
    const searchTerm = useDebouncedValue(search.trim())
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const {
        data,
        isLoading,
        error: listError,
        refetch,
    } = useSuppliersList({
        limit: crud.pageSize,
        offset,
        search: searchTerm || undefined,
    })
    const suppliers = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const {
        create,
        update,
        delete: remove,
        activate,
        deactivate,
    } = useSupplierMutations()
    const isPending = create.isPending || update.isPending

    const handleFormSubmit = async (formData: SupplierFormValues) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: formData,
                })
                notifySuccess(
                    'Proveedor actualizado',
                    'El proveedor se actualizó correctamente'
                )
            } else {
                await create.mutateAsync(formData)
                notifySuccess(
                    'Proveedor creado',
                    'El proveedor se creó correctamente'
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar el proveedor')
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            notifySuccess(
                'Proveedor eliminado',
                'El proveedor se eliminó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el proveedor')
        }
    }

    const handleToggleStatus = async (supplier: Supplier) => {
        try {
            if (supplier.isActive) {
                await deactivate.mutateAsync(supplier.id)
                notifyInfo(
                    'Proveedor desactivado',
                    'El proveedor se desactivó correctamente'
                )
            } else {
                await activate.mutateAsync(supplier.id)
                notifySuccess(
                    'Proveedor activado',
                    'El proveedor se activó correctamente'
                )
            }
        } catch (error: unknown) {
            notifyError(error, 'Error al cambiar el estado del proveedor')
        }
    }

    const columns: ColumnDef<Supplier>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            cell: (props) => {
                const { row } = props
                return <span className="font-medium">#{row.original.id}</span>
            },
        },
        {
            header: 'Nombre',
            accessorKey: 'name',
            cell: (props) => {
                const { row } = props
                return (
                    <span className="font-semibold">{row.original.name}</span>
                )
            },
        },
        {
            header: 'Identificación',
            accessorKey: 'taxId',
        },
        {
            header: 'Tipo',
            accessorKey: 'taxType',
            cell: ({ row }) => TAX_TYPE_LABELS[row.original.taxType],
        },
        {
            header: 'Email',
            accessorKey: 'email',
            cell: ({ row }) => row.original.email || '-',
        },
        {
            header: 'Teléfono',
            accessorKey: 'phone',
            cell: ({ row }) => row.original.phone || '-',
        },
        {
            header: 'Ciudad',
            accessorKey: 'city',
            cell: ({ row }) => row.original.city || '-',
        },
        {
            header: 'Estado',
            accessorKey: 'isActive',
            cell: ({ row }) => <ActiveBadge active={row.original.isActive} />,
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={`Ver ${row.original.name}`}
                        icon={<HiOutlineEye />}
                        onClick={() =>
                            navigate(`/suppliers/${row.original.id}`)
                        }
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={`Editar ${row.original.name}`}
                        icon={<HiOutlinePencil />}
                        onClick={() => crud.openEdit(row.original)}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={`${
                            row.original.isActive ? 'Desactivar' : 'Activar'
                        } ${row.original.name}`}
                        icon={
                            row.original.isActive ? (
                                <HiOutlineXCircle />
                            ) : (
                                <HiOutlineCheckCircle />
                            )
                        }
                        onClick={() => handleToggleStatus(row.original)}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={`Eliminar ${row.original.name}`}
                        icon={<HiOutlineTrash />}
                        onClick={() => crud.openDelete(row.original)}
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Proveedores"
                description="Gestiona los proveedores registrados"
                actions={
                    <>
                        <ListSearchInput
                            placeholder="Buscar por nombre o identificación"
                            value={search}
                            onChange={(value) => {
                                setSearch(value)
                                crud.onPaginationChange(1, crud.pageSize)
                            }}
                        />
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiOutlinePlus />}
                            onClick={crud.openCreate}
                        >
                            Nuevo Proveedor
                        </Button>
                    </>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={suppliers}
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
                formId="supplier-form"
                width={800}
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <SupplierForm
                    formId="supplier-form"
                    supplier={crud.selectedItem}
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

export default SuppliersListPage
