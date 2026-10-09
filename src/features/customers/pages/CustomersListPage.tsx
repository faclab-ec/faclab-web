import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import ListSearchInput from '@shared/ui/ListSearchInput'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { FormModal, DeleteConfirmDialog } from '@/components/shared'
import { notifySuccess, notifyInfo, notifyError } from '@shared/ui/notify'
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineEye,
} from 'react-icons/hi'
import { useCustomersList, useCustomerMutations } from '../hooks/useCustomers'
import { CustomerForm } from '../components/CustomerForm'
import type { Customer } from '../model/types'
import { TAX_TYPE_LABELS } from '../model/types'
import type { CustomerFormValues } from '../model/customer.schema'

const CustomersListPage = () => {
    const navigate = useNavigate()
    const crud = useCrudOperations<Customer>()
    const [search, setSearch] = useState('')
    const searchTerm = useDebouncedValue(search.trim())
    const offset = (crud.pageIndex - 1) * crud.pageSize

    const { data, isLoading } = useCustomersList({
        limit: crud.pageSize,
        offset,
        search: searchTerm || undefined,
    })
    const customers = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const mutations = useCustomerMutations()
    const isPending = mutations.create.isPending || mutations.update.isPending

    const handleFormSubmit = async (formData: CustomerFormValues) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await mutations.update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: formData,
                })
                notifySuccess(
                    'Cliente actualizado',
                    'El cliente se actualizó correctamente'
                )
            } else {
                await mutations.create.mutateAsync(formData)
                notifySuccess(
                    'Cliente creado',
                    'El cliente se creó correctamente'
                )
            }
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar el cliente')
        }
    }

    const handleDeleteConfirm = async () => {
        if (!crud.selectedItem) return
        try {
            await mutations.delete.mutateAsync(crud.selectedItem.id)
            notifySuccess(
                'Cliente eliminado',
                'El cliente se eliminó correctamente'
            )
            crud.closeAll()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el cliente')
        }
    }

    const handleToggleStatus = async (customer: Customer) => {
        try {
            if (customer.isActive) {
                await mutations.deactivate.mutateAsync(customer.id)
                notifyInfo(
                    'Cliente desactivado',
                    'El cliente se desactivó correctamente'
                )
            } else {
                await mutations.activate.mutateAsync(customer.id)
                notifySuccess(
                    'Cliente activado',
                    'El cliente se activó correctamente'
                )
            }
        } catch (error: unknown) {
            notifyError(error, 'Error al cambiar el estado del cliente')
        }
    }

    const columns: ColumnDef<Customer>[] = [
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
                            navigate(`/customers/${row.original.id}`)
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
                            <h4 className="text-lg font-semibold">Clientes</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Gestiona los clientes registrados
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
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
                                Nuevo Cliente
                            </Button>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={customers}
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
                formId="customer-form"
                width={800}
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar Cliente' : 'Nuevo Cliente'}
                isSubmitting={isPending}
                onClose={crud.closeAll}
            >
                <CustomerForm
                    formId="customer-form"
                    customer={crud.selectedItem}
                    isSubmitting={isPending}
                    onSubmit={handleFormSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={crud.selectedItem?.name}
                isDeleting={mutations.delete.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDeleteConfirm}
            />
        </>
    )
}

export default CustomersListPage
