import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import LabeledField from '@/components/shared/LabeledField'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useReviewDiscrepancy } from '../hooks/useSales'
import {
    DISCREPANCY_KIND_LABELS,
    type InvoiceDiscrepancy,
} from '../model/types'

interface ReviewDiscrepancyDialogProps {
    discrepancy: InvoiceDiscrepancy | null
    onClose: () => void
}

/** Marca una discrepancia revisada, con una nota de lo que se hizo */
const ReviewDiscrepancyDialog = ({
    discrepancy,
    onClose,
}: ReviewDiscrepancyDialogProps) => {
    const [note, setNote] = useState('')
    const review = useReviewDiscrepancy()

    const close = () => {
        setNote('')
        onClose()
    }

    const handleSave = async () => {
        if (!discrepancy) return
        try {
            await review.mutateAsync({ id: discrepancy.id, note: note.trim() })
            notifySuccess('Discrepancia marcada como revisada')
            close()
        } catch (error) {
            notifyError(
                error,
                'No se pudo marcar la discrepancia como revisada'
            )
        }
    }

    return (
        <Dialog
            isOpen={discrepancy !== null}
            width={500}
            contentLabel="Marcar revisada"
            onClose={close}
            onRequestClose={close}
        >
            <h5 className="mb-2">Marcar revisada</h5>
            {discrepancy && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {DISCREPANCY_KIND_LABELS[discrepancy.kind]} · venta{' '}
                    {discrepancy.sale?.number ?? `#${discrepancy.saleId}`}. Sale
                    de la lista de abiertas y queda en la bitácora.
                </p>
            )}
            <LabeledField label="Nota">
                <Input
                    textArea
                    maxLength={500}
                    placeholder="Qué se hizo o por qué no necesita nada"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </LabeledField>
            <div className="flex justify-end gap-2 mt-6">
                <Button variant="plain" onClick={close}>
                    Cancelar
                </Button>
                <Button
                    variant="solid"
                    loading={review.isPending}
                    onClick={handleSave}
                >
                    Marcar revisada
                </Button>
            </div>
        </Dialog>
    )
}

export default ReviewDiscrepancyDialog
