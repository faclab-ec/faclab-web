import { useState } from 'react'
import { HiPlus } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/shared'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useIntegrationClientMutations } from '../hooks/useIntegrations'
import { INTEGRATION_ERROR_MESSAGES } from '../model/errors'
import NewSecretModal from './NewSecretModal'
import CredentialsDialog, { type Credentials } from './CredentialsDialog'
import type { ClientSecret, IntegrationClient } from '../model/types'

const secretState = (secret: ClientSecret) => {
    if (secret.revokedAt) return { tone: 'danger' as const, label: 'Revocado' }
    if (!secret.isActive) return { tone: 'neutral' as const, label: 'Vencido' }
    if (secret.expiresAt)
        return { tone: 'warning' as const, label: 'Por vencer' }
    return { tone: 'success' as const, label: 'Activo' }
}

const date = (value: string | null, empty = '-') =>
    value ? formatDatetime(value) : empty

interface ClientSecretsSectionProps {
    client: IntegrationClient
}

/** Los secretos del cliente: crear uno (rotar) y revocar. */
const ClientSecretsSection = ({ client }: ClientSecretsSectionProps) => {
    const { createSecret, revokeSecret } = useIntegrationClientMutations()
    const [creating, setCreating] = useState(false)
    const [revoking, setRevoking] = useState<ClientSecret | null>(null)
    const [credentials, setCredentials] = useState<Credentials | null>(null)
    const revoked = client.status === 'REVOKED'
    const active = client.secrets.filter((s) => s.isActive).length

    const handleCreate = async (previousExpiresInDays: number | null) => {
        try {
            const secret = await createSecret.mutateAsync({
                id: client.id,
                data: { previousExpiresInDays },
            })
            setCreating(false)
            setCredentials({
                title: `Nuevo secreto de ${client.name}`,
                clientId: client.clientId,
                secret: secret.clientSecret,
            })
        } catch (err) {
            notifyError(err, 'No se pudo crear el secreto', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    const handleRevoke = async () => {
        if (!revoking) return
        try {
            await revokeSecret.mutateAsync({
                id: client.id,
                secretId: revoking.id,
            })
            notifySuccess(
                'Secreto revocado',
                'Sus tokens dejan de valer en menos de un minuto'
            )
            setRevoking(null)
        } catch (err) {
            notifyError(err, 'No se pudo revocar el secreto', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    const columns: ColumnDef<ClientSecret>[] = [
        {
            header: 'Prefijo',
            accessorKey: 'prefix',
            cell: (props) => (
                <span className="font-mono">{props.row.original.prefix}…</span>
            ),
        },
        {
            header: 'Estado',
            id: 'state',
            cell: (props) => {
                const state = secretState(props.row.original)
                return (
                    <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                )
            },
        },
        {
            header: 'Creado',
            accessorKey: 'createdAt',
            cell: (props) => date(props.row.original.createdAt),
        },
        {
            header: 'Vence',
            accessorKey: 'expiresAt',
            cell: (props) =>
                props.row.original.revokedAt
                    ? `Revocado el ${date(props.row.original.revokedAt)}`
                    : date(props.row.original.expiresAt, 'No vence'),
        },
        {
            header: 'Último uso',
            accessorKey: 'lastUsedAt',
            cell: (props) => date(props.row.original.lastUsedAt, 'Nunca'),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) =>
                props.row.original.isActive && !revoked ? (
                    <Button
                        size="xs"
                        variant="plain"
                        onClick={() => setRevoking(props.row.original)}
                    >
                        Revocar
                    </Button>
                ) : null,
        },
    ]

    return (
        <Card
            header={<h2 className="text-lg">Secretos</h2>}
            headerExtra={
                !revoked && (
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlus />}
                        onClick={() => setCreating(true)}
                    >
                        Nuevo secreto
                    </Button>
                )
            }
            bodyClass="p-0"
        >
            <DataTable columns={columns} data={client.secrets} />

            <NewSecretModal
                // Cada apertura empieza en la opción por defecto
                key={String(creating)}
                isOpen={creating}
                activeSecrets={active}
                isSubmitting={createSecret.isPending}
                onClose={() => setCreating(false)}
                onSubmit={handleCreate}
            />

            <ConfirmDialog
                isOpen={!!revoking}
                type="danger"
                title="Revocar secreto"
                confirmText="Revocar"
                confirmButtonColor="red-600"
                onClose={() => setRevoking(null)}
                onCancel={() => setRevoking(null)}
                onConfirm={handleRevoke}
            >
                <p>
                    El secreto{' '}
                    <span className="font-mono">{revoking?.prefix}…</span> deja
                    de servir para pedir tokens y los que ya emitió dejan de
                    valer en menos de un minuto.
                    {active <= 1 &&
                        ' Es el único activo: el integrador se queda sin acceso hasta que crees otro.'}
                </p>
            </ConfirmDialog>

            <CredentialsDialog
                credentials={credentials}
                onClose={() => setCredentials(null)}
            />
        </Card>
    )
}

export default ClientSecretsSection
