import type { ReactNode } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'

interface FormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit?: () => void
    formId?: string
    title: string
    isSubmitting?: boolean
    width?: number
    children: ReactNode
}

const FormModal = ({
    isOpen,
    onClose,
    onSubmit,
    formId,
    title,
    isSubmitting = false,
    width,
    children,
}: FormModalProps) => (
    <Dialog
        isOpen={isOpen}
        contentLabel={title}
        width={width}
        shouldCloseOnEsc={!isSubmitting}
        shouldCloseOnOverlayClick={!isSubmitting}
        onClose={onClose}
        onRequestClose={onClose}
    >
        <div className="flex flex-col h-full justify-between">
            <h4 className="mb-5 pr-8">{title}</h4>
            <div className="flex-1 max-h-[60vh] overflow-y-auto pr-1">
                {children}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="plain"
                    disabled={isSubmitting}
                    onClick={onClose}
                >
                    Cancelar
                </Button>
                {formId ? (
                    <Button
                        type="submit"
                        form={formId}
                        variant="solid"
                        loading={isSubmitting}
                    >
                        Guardar
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="solid"
                        loading={isSubmitting}
                        onClick={onSubmit}
                    >
                        Guardar
                    </Button>
                )}
            </div>
        </div>
    </Dialog>
)

export default FormModal
