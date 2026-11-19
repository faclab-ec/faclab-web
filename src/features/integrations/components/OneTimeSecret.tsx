import Alert from '@/components/ui/Alert'
import SecretValue from './SecretValue'

interface OneTimeSecretProps {
    clientId: string
    secret: string
}

/**
 * Las credenciales recién creadas. El core solo guarda el hash del secreto:
 * esta es la única vez que se ve.
 */
const OneTimeSecret = ({ clientId, secret }: OneTimeSecretProps) => (
    <div className="flex flex-col gap-4">
        <Alert showIcon type="warning">
            Copia el secreto y guárdalo en el servidor del integrador. No lo
            podrás ver de nuevo: si se pierde, crea otro.
        </Alert>
        <SecretValue
            label="Client ID"
            value={clientId}
            copiedMessage="Client ID copiado"
        />
        <SecretValue
            label="Secreto"
            value={secret}
            copiedMessage="Secreto copiado"
        />
    </div>
)

export default OneTimeSecret
