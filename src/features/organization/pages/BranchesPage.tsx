import { Link } from 'react-router-dom'
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge, { ActiveBadge } from '@/components/shared/StatusBadge'
import { DeleteConfirmDialog, FormModal } from '@/components/shared'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { PERMISSION } from '@/constants/permissions.constant'
import { useCan, useSession } from '@/stores'
import { tenantDisplayName } from '@features/auth'
import { useBranchesList, useBranchMutations } from '../hooks/useOrganization'
import { ORGANIZATION_ERROR_MESSAGES } from '../model/errors'
import BranchForm from '../components/BranchForm'
import type { BranchInput } from '../api/client'
import type { Branch } from '../model/types'

const FORM_ID = 'branch-form'

const BranchesPage = () => {
    const session = useSession()
    const canWrite = useCan(PERMISSION.ORGANIZATION_WRITE)
    const crud = useCrudOperations<Branch>()
    const { data, isLoading, error, refetch } = useBranchesList({
        limit: crud.pageSize,
        offset: (crud.pageIndex - 1) * crud.pageSize,
    })
    const { create, update, delete: remove } = useBranchMutations()
    const isSaving = create.isPending || update.isPending

    const handleSubmit = async (values: BranchInput) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: values,
                })
                notifySuccess('Sucursal actualizada')
            } else {
                await create.mutateAsync(values)
                notifySuccess('Sucursal creada')
            }
            crud.closeAll()
        } catch (err) {
            notifyError(err, 'No se pudo guardar la sucursal', {
                messages: ORGANIZATION_ERROR_MESSAGES,
            })
        }
    }

    const handleDelete = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            notifySuccess('Sucursal eliminada')
            crud.closeAll()
        } catch (err) {
            notifyError(err, 'No se pudo eliminar la sucursal', {
                messages: ORGANIZATION_ERROR_MESSAGES,
            })
        }
    }

    const columns: ColumnDef<Branch>[] = [
        {
            header: 'Establecimiento',
            accessorKey: 'establishmentCode',
            cell: (props) => (
                <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-700">
                    {props.row.original.establishmentCode}
                </span>
            ),
        },
        {
            header: 'Nombre',
            accessorKey: 'name',
            cell: (props) => (
                <span className="flex items-center gap-2">
                    <Link
                        className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
                        to={`/settings/branches/${props.row.original.id}`}
                    >
                        {props.row.original.name}
                    </Link>
                    {props.row.original.isMain && (
                        <StatusBadge tone="info">Matriz</StatusBadge>
                    )}
                </span>
            ),
        },
        {
            header: 'Dirección',
            accessorKey: 'address',
            cell: (props) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {props.row.original.address || '-'}
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
    ]

    if (canWrite) {
        columns.push({
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
                    {!props.row.original.isMain && (
                        <Button
                            size="sm"
                            variant="plain"
                            aria-label={`Eliminar ${props.row.original.name}`}
                            icon={<HiOutlineTrash />}
                            onClick={() => crud.openDelete(props.row.original)}
                        />
                    )}
                </div>
            ),
        })
    }

    return (
        <>
            <PageHeader
                title="Sucursales"
                description={
                    session
                        ? `Establecimientos SRI de ${tenantDisplayName(
                              session.tenant
                          )}, con sus puntos de emisión y cajas`
                        : undefined
                }
                actions={
                    canWrite && (
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={crud.openCreate}
                        >
                            Nueva sucursal
                        </Button>
                    )
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={data?.items ?? []}
                    loading={isLoading}
                    error={error}
                    pagingData={{
                        total: data?.pagination?.total ?? 0,
                        pageIndex: crud.pageIndex,
                        pageSize: crud.pageSize,
                    }}
                    onRetry={refetch}
                    onPaginationChange={(page) =>
                        crud.onPaginationChange(page, crud.pageSize)
                    }
                    onSelectChange={(size) => crud.onPaginationChange(1, size)}
                />
            </Card>

            <FormModal
                formId={FORM_ID}
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar sucursal' : 'Nueva sucursal'}
                isSubmitting={isSaving}
                onClose={crud.closeAll}
            >
                <BranchForm
                    formId={FORM_ID}
                    branch={crud.selectedItem}
                    isSubmitting={isSaving}
                    onSubmit={handleSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={
                    crud.selectedItem
                        ? `${crud.selectedItem.establishmentCode} · ${crud.selectedItem.name}`
                        : undefined
                }
                isDeleting={remove.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDelete}
            />
        </>
    )
}

export default BranchesPage
