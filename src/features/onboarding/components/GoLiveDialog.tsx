import { useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useGoLive } from '../hooks/useOnboarding'
import { ONBOARDING_ERROR_MESSAGES } from '../model/types'

interface Props {
    open: boolean
    /** El RUC de la empresa: hay que escribirlo igual para confirmar */
    ruc: string
    onClose: () => void
}

/**
 * Confirmación explícita del paso a producción (S8.5): se escribe el RUC de la
 * empresa y se acepta. El servidor lo audita; no hay vuelta atrás.
 */
const GoLiveDialog = ({ open, ruc, onClose }: Props) => {
    const goLive = useGoLive()
    const [typed, setTyped] = useState('')
    const [accepted, setAccepted] = useState(false)
    const matches = typed.trim() === ruc

    const close = () => {
        if (goLive.isPending) return
        setTyped('')
        setAccepted(false)
        onClose()
    }

    const confirm = async () => {
        try {
            await goLive.mutateAsync(typed.trim())
            notifySuccess(
                'La empresa emite en producción',
                'Las facturas que siguen son reales.'
            )
            close()
        } catch (err) {
            notifyError(err, 'No se pudo pasar a producción', {
                messages: ONBOARDING_ERROR_MESSAGES,
            })
        }
    }

    return (
        <Dialog
            contentLabel="Pasar a producción"
            isOpen={open}
            width={520}
            shouldCloseOnEsc={!goLive.isPending}
            shouldCloseOnOverlayClick={!goLive.isPending}
            onClose={close}
            onRequestClose={close}
        >
            <h5 className="mb-3">Pasar a producción</h5>
            <Alert showIcon className="mb-4" type="warning">
                Desde aquí las facturas se emiten al SRI de verdad y no se
                pueden anular editando. La factura de prueba se olvida y los
                números que usó vuelven al contador. Este paso queda registrado
                a tu nombre y no se puede deshacer.
            </Alert>
            <label className="mb-1 block text-sm" htmlFor="go-live-ruc">
                Escribe el RUC de la empresa ({ruc}) para confirmar
            </label>
            <Input
                autoComplete="off"
                id="go-live-ruc"
                inputMode="numeric"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
            />
            <div className="mt-4">
                <Checkbox checked={accepted} onChange={setAccepted}>
                    Entiendo que desde ahora emito facturas reales
                </Checkbox>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button
                    disabled={goLive.isPending}
                    type="button"
                    variant="plain"
                    onClick={close}
                >
                    Cancelar
                </Button>
                <Button
                    color="red-600"
                    disabled={!matches || !accepted}
                    loading={goLive.isPending}
                    variant="solid"
                    onClick={confirm}
                >
                    Pasar a producción
                </Button>
            </div>
        </Dialog>
    )
}

export default GoLiveDialog
