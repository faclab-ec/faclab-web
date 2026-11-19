import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import OneTimeSecret from './OneTimeSecret'

export interface Credentials {
    title: string
    clientId: string
    secret: string
}

interface CredentialsDialogProps {
    credentials: Credentials | null
    onClose: () => void
}

/**
 * Muestra un secreto recién creado (cliente nuevo o secreto nuevo). No se
 * cierra con Esc ni haciendo clic afuera: solo con "Ya lo guardé", para no
 * perderlo por accidente.
 */
const CredentialsDialog = ({
    credentials,
    onClose,
}: CredentialsDialogProps) => (
    <Dialog
        isOpen={!!credentials}
        width={560}
        contentLabel={credentials?.title}
        closable={false}
        shouldCloseOnEsc={false}
        shouldCloseOnOverlayClick={false}
        onClose={onClose}
        onRequestClose={onClose}
    >
        {credentials && (
            <>
                <h4 className="mb-4">{credentials.title}</h4>
                <OneTimeSecret
                    clientId={credentials.clientId}
                    secret={credentials.secret}
                />
                <div className="mt-6 flex justify-end">
                    <Button variant="solid" onClick={onClose}>
                        Ya lo guardé
                    </Button>
                </div>
            </>
        )}
    </Dialog>
)

export default CredentialsDialog
