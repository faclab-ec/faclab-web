import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiPlus } from 'react-icons/hi'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import PageHeader from '@/components/shared/PageHeader'
import { FormModal } from '@/components/shared'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useIntegrationClients } from '../hooks/useIntegrations'
import {
    useWebhookEndpointMutations,
    useWebhookEndpoints,
} from '../hooks/useWebhooks'
import { INTEGRATION_ERROR_MESSAGES } from '../model/errors'
import {
    WEBHOOK_ENDPOINT_STATUSES,
    WEBHOOK_ENDPOINT_STATUS_LABELS,
    type WebhookEndpoint,
    type WebhookEndpointStatus,
} from '../model/types'
import WebhookEndpointsTable from '../components/WebhookEndpointsTable'
import WebhookEndpointCreateForm from '../components/WebhookEndpointCreateForm'
import type { WebhookEndpointInput } from '../api/client'

const FORM_ID = 'webhook-endpoint-form'

const statusOptions = [
    { value: undefined as WebhookEndpointStatus | undefined, label: 'Todos' },
    ...WEBHOOK_ENDPOINT_STATUSES.map((status) => ({
        value: status as WebhookEndpointStatus | undefined,
        label: `${WEBHOOK_ENDPOINT_STATUS_LABELS[status]}s`,
    })),
]

const WebhookEndpointsPage = () => {
    const navigate = useNavigate()
    const crud = useCrudOperations<WebhookEndpoint>()
    const [status, setStatus] = useState<WebhookEndpointStatus | undefined>()
    const { data, isLoading, error, refetch } = useWebhookEndpoints({
        status,
        limit: crud.pageSize,
        offset: (crud.pageIndex - 1) * crud.pageSize,
    })
    const clients = useIntegrationClients({ limit: 1000 })
    const { create } = useWebhookEndpointMutations()
    const allClients = clients.data?.items ?? []

    const handleSubmit = async (values: WebhookEndpointInput) => {
        try {
            const endpoint = await create.mutateAsync(values)
            notifySuccess('Webhook creado')
            crud.closeAll()
            navigate(`/settings/webhooks/${endpoint.id}`)
        } catch (err) {
            notifyError(err, 'No se pudo crear el webhook', {
                messages: INTEGRATION_ERROR_MESSAGES,
            })
        }
    }

    return (
        <>
            <PageHeader
                title="Webhooks"
                description="Direcciones a las que Faclab avisa, con un POST firmado, cada vez que pasa algo: una venta, una factura autorizada, un cambio de stock"
                actions={
                    <>
                        <Select
                            size="sm"
                            className="min-w-[150px]"
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
                            Nuevo webhook
                        </Button>
                    </>
                }
            />
            <Card bodyClass="p-0">
                <WebhookEndpointsTable
                    endpoints={data?.items ?? []}
                    clients={allClients}
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
                title="Nuevo webhook"
                isSubmitting={create.isPending}
                onClose={crud.closeAll}
            >
                <WebhookEndpointCreateForm
                    formId={FORM_ID}
                    clients={allClients.filter((c) => c.status === 'ACTIVE')}
                    isSubmitting={create.isPending}
                    onSubmit={handleSubmit}
                />
            </FormModal>
        </>
    )
}

export default WebhookEndpointsPage
