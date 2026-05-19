import { useNavigate } from 'react-router-dom'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import useCrudOperations from '@shared/hooks/useCrudOperations'
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
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const { data, isLoading } = useSuppliersList({
        limit: crud.pageSize,
        offset,
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
                toast.push(
                    <Notification title="Proveedor actualizado" type="success">
                        El proveedor se actualizó correctamente
                    </Notification>,
                    { placement: 'top-center' }
                )
            } else {
                await create.mutateAsync(formData)
                toast.push(
                    <Notification title="Proveedor creado" type="success">
                        El proveedor se creó correctamente
                    </Notification>,
                    { placement: 'top-center' }
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al guardar el proveedor')}
                </Notification>,
                { placement: 'top-center' }
            )
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            toast.push(
                <Notification title="Proveedor eliminado" type="success">
                    El proveedor se eliminó correctamente
                </Notification>,
                { placement: 'top-center' }
            )
            crud.closeAll()
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al eliminar el proveedor')}
                </Notification>,
                { placement: 'top-center' }
            )
        }
    }

    const handleToggleStatus = async (supplier: Supplier) => {
        try {
            if (supplier.isActive) {
                await deactivate.mutateAsync(supplier.id)
                toast.push(
                    <Notification title="Proveedor desactivado" type="info">
                        El proveedor se desactivó correctamente
                    </Notification>,
                    { placement: 'top-center' }
                )
            } else {
                await activate.mutateAsync(supplier.id)
                toast.push(
                    <Notification title="Proveedor activado" type="success">
                        El proveedor se activó correctamente
                    </Notification>,
                    { placement: 'top-center' }
                )
            }
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(
                        error,
                        'Error al cambiar el estado del proveedor'
                    )}
                </Notification>,
                { placement: 'top-center' }
            )
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
            header: 'Tax ID',
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
            cell: ({ row }) => (
                <Badge
                    content={row.original.isActive ? 'Activo' : 'Inactivo'}
                    className={
                        row.original.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                    }
                />
            ),
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
            <Card>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-lg font-semibold">
                                Proveedores
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Gestiona los proveedores registrados
                            </p>
                        </div>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiOutlinePlus />}
                            onClick={crud.openCreate}
                        >
                            Nuevo Proveedor
                        </Button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={suppliers}
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
