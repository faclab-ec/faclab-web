import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'

interface DeleteConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    isPending?: boolean
    onConfirm: () => void
    onClose: () => void
}

const DeleteConfirmDialog = ({
    isOpen,
    title,
    message,
    isPending,
    onConfirm,
    onClose,
}: DeleteConfirmDialogProps) => (
    <Dialog isOpen={isOpen} onClose={onClose}>
        <h5 className="mb-4">{title}</h5>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-2">
            <Button variant="plain" onClick={onClose}>
                Cancelar
            </Button>
            <Button variant="solid" loading={isPending} onClick={onConfirm}>
                Eliminar
            </Button>
        </div>
    </Dialog>
)

export default DeleteConfirmDialog
