import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { ErrorState, FormModal } from '@/components/shared'
import LabeledField from '@/components/shared/LabeledField'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import {
    useWebhookEndpointMutations,
    useWebhookSecret,
} from '../hooks/useWebhooks'
import { INTEGRATION_ERROR_MESSAGES } from '../model/errors'
import SecretValue from './SecretValue'
import type { WebhookEndpoint } from '../model/types'

/** Cuánto sigue valiendo el secreto anterior al rotar (0 a 72 horas) */
const PREVIOUS_OPTIONS = [
    { value: 24, label: 'Sigue valiendo 24 horas' },
    { value: 1, label: 'Sigue valiendo 1 hora' },
    { value: 72, label: 'Sigue valiendo 72 horas' },
    { value: 0, label: 'Deja de valer ahora' },
]

interface WebhookSecretCardProps {
    endpoint: WebhookEndpoint
}

/**
 * El secreto con el que se firman los mensajes. Se guarda cifrado, así que se
 * puede leer de nuevo; solo se pide al servidor cuando se quiere ver.
 */
const WebhookSecretCard = ({ endpoint }: WebhookSecretCardProps) => {
    const [visible, setVisible] = useState(false)
    const [rotating, setRotating] = useState(false)
    const [hours, setHours] = useState(24)
    const secret = useWebhookSecret(endpoint.id, visible)
    const { rotateSecret } = useWebhookEndpointMutations()

    const handleRotate = async () => {
        try {
            await rotateSecret.mutateAsync({
                id: endpoint.id,
                data: { previousExpiresInHours: hours },
            })
            notifySuccess(
                'Secreto rotado',
                hours
                    ? `El anterior sigue valiendo ${hours} h: actualiza el receptor antes`
                    : 'El anterior dejó de valer'
            )
            setRotating(false)
            setVisible(true)
        } catch (err) {
            notifyError(err, 'No se pudo rotar el secreto', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    return (
        <Card
            header={<h2 className="text-lg">Secreto de firma</h2>}
            headerExtra={
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => setVisible(!visible)}>
                        {visible ? 'Ocultar' : 'Mostrar secreto'}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => {
                            setHours(24)
                            setRotating(true)
                        }}
                    >
                        Rotar secreto
                    </Button>
                </div>
            }
        >
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Empieza por{' '}
                <span className="font-mono">{endpoint.secretHint}…</span>. El
                receptor lo usa para comprobar la firma{' '}
                <span className="font-mono">webhook-signature</span>.
                {endpoint.previousSecretExpiresAt &&
                    ` El anterior sigue valiendo hasta el ${formatDatetime(
                        endpoint.previousSecretExpiresAt
                    )}: mientras tanto cada mensaje lleva las dos firmas.`}
            </p>
            {visible && (
                <div className="mt-4 flex flex-col gap-4">
                    {secret.isLoading ? (
                        <Spinner />
                    ) : secret.error ? (
                        <ErrorState
                            error={secret.error}
                            onRetry={() => secret.refetch()}
                        />
                    ) : (
                        secret.data && (
                            <>
                                <SecretValue
                                    label="Secreto"
                                    value={secret.data.secret}
                                    copiedMessage="Secreto copiado"
                                />
                                {secret.data.previousSecret && (
                                    <SecretValue
                                        label="Secreto anterior"
                                        value={secret.data.previousSecret}
                                        copiedMessage="Secreto anterior copiado"
                                    />
                                )}
                            </>
                        )
                    )}
                </div>
            )}

            <FormModal
                isOpen={rotating}
                title="Rotar secreto"
                isSubmitting={rotateSecret.isPending}
                onClose={() => setRotating(false)}
                onSubmit={handleRotate}
            >
                <p className="mb-4 text-sm">
                    Se crea un secreto nuevo para firmar los mensajes. Mientras
                    el anterior siga valiendo, cada mensaje lleva las dos
                    firmas, así el receptor no rechaza nada mientras cambia de
                    secreto.
                </p>
                <LabeledField label="El secreto anterior">
                    <Select
                        options={PREVIOUS_OPTIONS}
                        value={
                            PREVIOUS_OPTIONS.find((o) => o.value === hours) ??
                            null
                        }
                        onChange={(option) => setHours(option?.value ?? 24)}
                    />
                </LabeledField>
            </FormModal>
        </Card>
    )
}

export default WebhookSecretCard
