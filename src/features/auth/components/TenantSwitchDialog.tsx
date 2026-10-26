import Dialog from '@/components/ui/Dialog'
import { useSession } from '@/stores'
import { notifyError } from '@shared/ui/notify'
import { useSwitchTenant } from '../hooks/useAuth'
import { tenantDisplayName } from '../lib/tenant'
import TenantPicker from './TenantPicker'

interface TenantSwitchDialogProps {
    isOpen: boolean
    onClose: () => void
}

/** Cambia de empresa sin cerrar sesión (menú de usuario). */
const TenantSwitchDialog = ({ isOpen, onClose }: TenantSwitchDialogProps) => {
    const session = useSession()
    const switchTenant = useSwitchTenant()

    if (!session) return null

    const pending = switchTenant.isPending

    return (
        <Dialog
            isOpen={isOpen}
            contentLabel="Cambiar empresa"
            shouldCloseOnEsc={!pending}
            shouldCloseOnOverlayClick={!pending}
            closable={!pending}
            onClose={onClose}
            onRequestClose={onClose}
        >
            <h4 className="mb-1 pr-8">Cambiar empresa</h4>
            <p className="mb-5 text-gray-500 dark:text-gray-400">
                Trabajas en {tenantDisplayName(session.tenant)}. Elige otra
                empresa para continuar en ella.
            </p>
            <TenantPicker
                tenants={session.tenants}
                currentId={session.tenant.id}
                pendingId={pending ? switchTenant.variables : null}
                disabled={pending}
                onSelect={(tenant) =>
                    switchTenant.mutate(tenant.id, {
                        onSuccess: onClose,
                        onError: (err) =>
                            notifyError(err, 'No se pudo cambiar de empresa'),
                    })
                }
            />
        </Dialog>
    )
}

export default TenantSwitchDialog
