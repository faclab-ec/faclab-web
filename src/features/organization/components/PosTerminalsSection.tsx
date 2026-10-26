import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { DeleteConfirmDialog, FormModal } from '@/components/shared'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { usePosTerminalMutations } from '../hooks/useOrganization'
import { ORGANIZATION_ERROR_MESSAGES } from '../model/errors'
import PosTerminalForm from './PosTerminalForm'
import type { PosTerminalInput } from '../api/client'
import type { EmissionPoint, PosTerminal } from '../model/types'

const FORM_ID = 'pos-terminal-form'

interface PosTerminalsSectionProps {
    branchId: number
    terminals: PosTerminal[]
    emissionPoints: EmissionPoint[]
    loading: boolean
    error: unknown
    onRetry: () => void
    canWrite: boolean
}

/** Cajas de una sucursal: cada navegador del POS se vincula a una. */
const PosTerminalsSection = ({
    branchId,
    terminals,
    emissionPoints,
    loading,
    error,
    onRetry,
    canWrite,
}: PosTerminalsSectionProps) => {
    const crud = useCrudOperations<PosTerminal>()
    const { create, update, delete: remove } = usePosTerminalMutations(branchId)
    const isSaving = create.isPending || update.isPending
    const emissionPointCode = (id: number) =>
        emissionPoints.find((p) => p.id === id)?.code ?? `#${id}`

    const handleSubmit = async (values: PosTerminalInput) => {
        try {
            if (crud.isEditOpen && crud.selectedItem) {
                await update.mutateAsync({
                    id: crud.selectedItem.id,
                    data: values,
                })
                notifySuccess('Caja actualizada')
            } else {
                await create.mutateAsync(values)
                notifySuccess('Caja creada')
            }
            crud.closeAll()
        } catch (err) {
            notifyError(err, 'No se pudo guardar la caja', {
                messages: ORGANIZATION_ERROR_MESSAGES,
            })
        }
    }

    const handleDelete = async () => {
        if (!crud.selectedItem) return
        try {
            await remove.mutateAsync(crud.selectedItem.id)
            notifySuccess('Caja eliminada')
            crud.closeAll()
        } catch (err) {
            notifyError(err, 'No se pudo eliminar la caja', {
                messages: ORGANIZATION_ERROR_MESSAGES,
            })
        }
    }

    const columns: ColumnDef<PosTerminal>[] = [
        {
            header: 'Código',
            accessorKey: 'code',
            cell: (props) => (
                <span className="font-mono">{props.row.original.code}</span>
            ),
        },
        { header: 'Nombre', accessorKey: 'name' },
        {
            header: 'Punto de emisión',
            accessorKey: 'emissionPointId',
            cell: (props) => (
                <span className="font-mono">
                    {emissionPointCode(props.row.original.emissionPointId)}
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
                        aria-label={`Editar caja ${props.row.original.code}`}
                        icon={<HiOutlinePencil />}
                        onClick={() => crud.openEdit(props.row.original)}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={`Eliminar caja ${props.row.original.code}`}
                        icon={<HiOutlineTrash />}
                        onClick={() => crud.openDelete(props.row.original)}
                    />
                </div>
            ),
        })
    }

    return (
        <Card
            header={<h2 className="text-lg">Cajas (terminales POS)</h2>}
            headerExtra={
                canWrite && (
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlus />}
                        onClick={crud.openCreate}
                    >
                        Nueva caja
                    </Button>
                )
            }
            bodyClass="p-0"
        >
            <DataTable
                columns={columns}
                data={terminals}
                loading={loading}
                error={error}
                onRetry={onRetry}
            />

            <FormModal
                formId={FORM_ID}
                isOpen={crud.isCreateOpen || crud.isEditOpen}
                title={crud.isEditOpen ? 'Editar caja' : 'Nueva caja'}
                isSubmitting={isSaving}
                onClose={crud.closeAll}
            >
                <PosTerminalForm
                    formId={FORM_ID}
                    branchId={branchId}
                    terminal={crud.selectedItem}
                    emissionPoints={emissionPoints}
                    isSubmitting={isSaving}
                    onSubmit={handleSubmit}
                />
            </FormModal>

            <DeleteConfirmDialog
                isOpen={crud.isDeleteOpen}
                itemName={
                    crud.selectedItem
                        ? `la caja ${crud.selectedItem.code}`
                        : undefined
                }
                isDeleting={remove.isPending}
                onClose={crud.closeAll}
                onConfirm={handleDelete}
            />
        </Card>
    )
}

export default PosTerminalsSection
