import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import type { TransferUpdateInput } from '../model/types'
import LabeledField from '@/components/shared/LabeledField'

type Props = {
    open: boolean
    editData: TransferUpdateInput
    isPending: boolean
    onClose: () => void
    onChange: (data: TransferUpdateInput) => void
    onSave: () => void
}

export const EditTransferDialog = ({
    open,
    editData,
    isPending,
    onClose,
    onChange,
    onSave,
}: Props) => (
    <Dialog
        isOpen={open}
        width={500}
        onClose={onClose}
        onRequestClose={onClose}
    >
        <h5 className="mb-4">Editar Transferencia</h5>
        <div className="space-y-4">
            <LabeledField label="Notas">
                <Input
                    textArea
                    placeholder="Observaciones"
                    value={editData.notes || ''}
                    onChange={(e) =>
                        onChange({ ...editData, notes: e.target.value })
                    }
                />
            </LabeledField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
            <Button variant="plain" onClick={onClose}>
                Cancelar
            </Button>
            <Button variant="solid" loading={isPending} onClick={onSave}>
                Guardar
            </Button>
        </div>
    </Dialog>
)
