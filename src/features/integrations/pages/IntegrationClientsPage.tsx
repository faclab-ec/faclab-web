import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiPlus } from 'react-icons/hi'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import DataTable, { type ColumnDef } from '@/components/shared/DataTable'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { FormModal } from '@/components/shared'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useBranchesList } from '@features/organization'
import {
    useIntegrationClientMutations,
    useIntegrationClients,
} from '../hooks/useIntegrations'
import { INTEGRATION_ERROR_MESSAGES } from '../model/errors'
import {
    INTEGRATION_CLIENT_STATUSES,
    INTEGRATION_CLIENT_STATUS_LABELS,
    INTEGRATION_CLIENT_STATUS_TONES,
    INTEGRATION_ENVIRONMENT_LABELS,
    INTEGRATION_ENVIRONMENT_TONES,
    type IntegrationClient,
    type IntegrationClientStatus,
} from '../model/types'
import IntegrationClientForm from '../components/IntegrationClientForm'
import CredentialsDialog, {
    type Credentials,
} from '../components/CredentialsDialog'
import type { IntegrationClientInput } from '../api/client'

const FORM_ID = 'integration-client-form'

const statusOptions = [
    { value: undefined as IntegrationClientStatus | undefined, label: 'Todos' },
    ...INTEGRATION_CLIENT_STATUSES.map((status) => ({
        value: status as IntegrationClientStatus | undefined,
        label: `${INTEGRATION_CLIENT_STATUS_LABELS[status]}s`,
    })),
]

const IntegrationClientsPage = () => {
    const crud = useCrudOperations<IntegrationClient>()
    const [status, setStatus] = useState<IntegrationClientStatus | undefined>(
        'ACTIVE'
    )
    const [credentials, setCredentials] = useState<Credentials | null>(null)
    const { data, isLoading, error, refetch } = useIntegrationClients({
        status,
        limit: crud.pageSize,
        offset: (crud.pageIndex - 1) * crud.pageSize,
    })
    const branches = useBranchesList({ limit: 1000 })
    const { create } = useIntegrationClientMutations()

    const handleSubmit = async (values: IntegrationClientInput) => {
        try {
            const client = await create.mutateAsync(values)
            crud.closeAll()
            notifySuccess('Cliente de integración creado')
            setCredentials({
                title: `Credenciales de ${client.name}`,
                clientId: client.clientId,
                secret: client.clientSecret,
            })
        } catch (err) {
            notifyError(err, 'No se pudo crear el cliente', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    const columns: ColumnDef<IntegrationClient>[] = [
        {
            header: 'Nombre',
            accessorKey: 'name',
            cell: (props) => (
                <Link
                    className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
                    to={`/settings/integrations/${props.row.original.id}`}
                >
                    {props.row.original.name}
                </Link>
            ),
        },
        {
            header: 'Client ID',
            accessorKey: 'clientId',
            cell: (props) => (
                <span className="font-mono text-sm">
                    {props.row.original.clientId}
                </span>
            ),
        },
        {
            header: 'Ambiente',
            accessorKey: 'environment',
            cell: (props) => (
                <StatusBadge
                    tone={
                        INTEGRATION_ENVIRONMENT_TONES[
                            props.row.original.environment
                        ]
                    }
                >
                    {
                        INTEGRATION_ENVIRONMENT_LABELS[
                            props.row.original.environment
                        ]
                    }
                </StatusBadge>
            ),
        },
        {
            header: 'Permisos',
            accessorKey: 'scopes',
            cell: (props) => props.row.original.scopes.length,
        },
        {
            header: 'Último uso',
            accessorKey: 'lastUsedAt',
            cell: (props) =>
                props.row.original.lastUsedAt
                    ? formatDatetime(props.row.original.lastUsedAt)
                    : 'Nunca',
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: (props) => (
                <StatusBadge
                    tone={
                        INTEGRATION_CLIENT_STATUS_TONES[
                            props.row.original.status
                        ]
                    }
                >
                    {
                        INTEGRATION_CLIENT_STATUS_LABELS[
                            props.row.original.status
                        ]
                    }
                </StatusBadge>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Integraciones"
                description="Clientes de la API pública: sistemas de terceros (tienda en línea, ERP) que leen y escriben datos de la empresa con sus propias credenciales"
                actions={
                    <>
                        <Select
                            size="sm"
                            className="min-w-[140px]"
                            aria-label="Estado"
                            options={statusOptions}
                            value={
                                statusOptions.find((o) => o.value === status) ??
                                null
                            }
                            onChange={(option) => {
                                setStatus(option?.value)
                                crud.onPaginationChange(1, crud.pageSize)
                            }}
                        />
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={crud.openCreate}
                        >
                            Nuevo cliente
                        </Button>
                    </>
                }
            />
            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={data?.items ?? []}
                    loading={isLoading}
                    error={error}
                    pagingData={{
                        total: data?.pagination?.total ?? 0,
                        pageIndex: crud.pageIndex,
                        pageSize: crud.pageSize,
                    }}
                    onRetry={refetch}
                    onPaginationChange={(page) =>
                        crud.onPaginationChange(page, crud.pageSize)
                    }
                    onSelectChange={(size) => crud.onPaginationChange(1, size)}
                />
            </Card>

            <FormModal
                formId={FORM_ID}
                width={640}
                isOpen={crud.isCreateOpen}
                title="Nuevo cliente de integración"
                isSubmitting={create.isPending}
                onClose={crud.closeAll}
            >
                <IntegrationClientForm
                    formId={FORM_ID}
                    client={null}
                    branches={branches.data?.items ?? []}
                    isSubmitting={create.isPending}
                    onSubmit={handleSubmit}
                />
            </FormModal>

            <CredentialsDialog
                credentials={credentials}
                onClose={() => setCredentials(null)}
            />
        </>
    )
}

export default IntegrationClientsPage
