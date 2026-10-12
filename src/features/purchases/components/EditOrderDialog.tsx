import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { SupplierSelect } from '@features/suppliers'
import type { PurchaseOrderUpdateInput } from '../model/types'
import LabeledField from '@/components/shared/LabeledField'

type EditData = PurchaseOrderUpdateInput & { supplierId: number }

type Props = {
    open: boolean
    editData: EditData
    isPending: boolean
    onClose: () => void
    onChange: (data: EditData) => void
    onSave: () => void
}

export const EditOrderDialog = ({
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
        <h5 className="mb-4">Editar Orden de Compra</h5>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">
                    Proveedor <span className="text-red-500">*</span>
                </label>
                <SupplierSelect
                    activeOnly
                    value={editData.supplierId}
                    onChange={(supplierId) =>
                        onChange({ ...editData, supplierId: supplierId ?? 0 })
                    }
                />
            </div>
            <LabeledField label="Fecha Esperada">
                <Input
                    type="date"
                    value={editData.expectedDate || ''}
                    onChange={(e) =>
                        onChange({ ...editData, expectedDate: e.target.value })
                    }
                />
            </LabeledField>
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
            <Button
                variant="solid"
                loading={isPending}
                disabled={editData.supplierId === 0}
                onClick={onSave}
            >
                Guardar
            </Button>
        </div>
    </Dialog>
)
