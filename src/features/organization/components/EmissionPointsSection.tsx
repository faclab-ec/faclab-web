import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { DeleteConfirmDialog, FormModal } from '@/components/shared'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useEmissionPointMutations } from '../hooks/useOrganization'
import { ORGANIZATION_ERROR_MESSAGES } from '../model/errors'
import EmissionPointForm from './EmissionPointForm'
import type { EmissionPointInput } from '../api/client'
import type { EmissionPoint } from '../model/types'

const FORM_ID = 'emission-point-form'

interface EmissionPointsSectionProps {
    branchId: number
    emissionPoints: EmissionPoint[]
    loading: boolean
    error: unknown
    onRetry: () => void
    canWrite: boolean
}

/** Puntos de emisión de una sucursal: la serie `001-00X` de sus facturas. */
const EmissionPointsSection = ({
    branchId,
    emissionPoints,
    loading,
    error,
    onRetry,
    canWrite,
}: EmissionPointsSectionProps) => {
    const crud = useCrudOperations<EmissionPoint>()
    const {
        create,
        update,
        delete: remove,
    } = useEmissionPointMutations(branchId)
    const isSaving = create.isPending || update.isPending

    const handleSubmit = async (values: EmissionPointInput) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: values,
                })
                notifySuccess('Punto de emisión actualizado')
            } else {
                await create.mutateAsync(values)
                notifySuccess('Punto de emisión creado')
            }
            crud.closeAll()
        } catch (err) {
            notifyError(err, 'No se pudo guardar el punto de emisión', {
                messages: ORGANIZATION_ERROR_MESSAGES,
            })
        }
    }

    const handleDelete = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            notifySuccess('Punto de emisión eliminado')
            crud.closeAll()
        } catch (err) {
            notifyError(err, 'No se pudo eliminar el punto de emisión', {
                messages: ORGANIZATION_ERROR_MESSAGES,
            })
        }
    }

    const columns: ColumnDef<EmissionPoint>[] = [
        {
            header: 'Código',
            accessorKey: 'code',
            cell: (props) => (
                <span className="font-mono">{props.row.original.code}</span>
            ),
        },
        {
            header: 'Nombre',
            accessorKey: 'name',
            cell: (props) => props.row.original.name || '-',
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
                        aria-label={`Editar punto de emisión ${props.row.original.code}`}
                        icon={<HiOutlinePencil />}
                        onClick={() => crud.openEdit(props.row.original)}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={`Eliminar punto de emisión ${props.row.original.code}`}
                        icon={<HiOutlineTrash />}
                        onClick={() => crud.openDelete(props.row.original)}
                    />
                </div>
            ),
        })
    }

    return (
        <Card
            header={<h2 className="text-lg">Puntos de emisión</h2>}
            headerExtra={
                canWrite && (
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlus />}
                        onClick={crud.openCreate}
                    >
                        Nuevo punto de emisión
                    </Button>
                )
            }
            bodyClass="p-0"
        >
            <DataTable
                columns={columns}
                data={emissionPoints}
                loading={loading}
                error={error}
                onRetry={onRetry}
            />

            <FormModal
                formId={FORM_ID}
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={
                    crud.isEditOpen
                        ? 'Editar punto de emisión'
                        : 'Nuevo punto de emisión'
                }
                isSubmitting={isSaving}
                onClose={crud.closeAll}
            >
                <EmissionPointForm
                    formId={FORM_ID}
                    emissionPoint={crud.selectedItem}
                    isSubmitting={isSaving}
                    onSubmit={handleSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={
                    crud.selectedItem
                        ? `el punto de emisión ${crud.selectedItem.code}`
                        : undefined
                }
                isDeleting={remove.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDelete}
            />
        </Card>
    )
}

export default EmissionPointsSection
