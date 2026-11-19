import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormContainer, FormItem } from '@/components/ui/Form'
import { ControlledSwitcher } from '@/components/ui/Form/controlled'
import {
    toWebhookEndpointInput,
    webhookEndpointCreateSchema,
    type WebhookEndpointCreateFormValues,
} from '../model/schemas'
import EventTypesField from './EventTypesField'
import type { WebhookEndpointInput } from '../api/client'
import type { IntegrationClient } from '../model/types'

interface WebhookEndpointCreateFormProps {
    formId: string
    /** Los clientes activos, para elegir el dueño */
    clients: IntegrationClient[]
    /** El dueño ya elegido (desde el detalle de un cliente) */
    defaultClientId?: number | null
    isSubmitting?: boolean
    onSubmit: (data: WebhookEndpointInput) => void
}

const COMPANY = {
    value: null as number | null,
    label: 'La empresa (sin cliente)',
}

const WebhookEndpointCreateForm = ({
    formId,
    clients,
    defaultClientId = null,
    isSubmitting = false,
    onSubmit,
}: WebhookEndpointCreateFormProps) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<WebhookEndpointCreateFormValues>({
        resolver: zodResolver(webhookEndpointCreateSchema),
        defaultValues: {
            url: '',
            description: '',
            eventTypes: [],
            excludeOwnChanges: false,
            integrationClientId: defaultClientId,
        },
    })
    const ownerId = useWatch({ control, name: 'integrationClientId' })
    const owner = clients.find((c) => c.id === ownerId) ?? null
    const ownerOptions = [
        COMPANY,
        ...clients.map((c) => ({
            value: c.id as number | null,
            label: `${c.name} (${c.clientId})`,
        })),
    ]

    return (
        <form
            id={formId}
            onSubmit={handleSubmit((values) =>
                onSubmit(toWebhookEndpointInput(values))
            )}
        >
            <FormContainer>
                <FormItem
                    asterisk
                    htmlFor="webhook-url"
                    label="URL"
                    invalid={!!errors.url}
                    errorMessage={errors.url?.message}
                    extra={
                        <span className="ml-2 text-xs text-gray-500">
                            HTTPS, en una dirección pública
                        </span>
                    }
                >
                    <Input
                        id="webhook-url"
                        placeholder="https://tienda.example/webhooks/faclab"
                        disabled={isSubmitting}
                        invalid={!!errors.url}
                        {...register('url')}
                    />
                </FormItem>
                <FormItem
                    htmlFor="webhook-description"
                    label="Descripción"
                    invalid={!!errors.description}
                    errorMessage={errors.description?.message}
                >
                    <Input
                        id="webhook-description"
                        placeholder="Ej: Pedidos de la tienda en línea"
                        disabled={isSubmitting}
                        invalid={!!errors.description}
                        {...register('description')}
                    />
                </FormItem>
                <FormItem
                    htmlFor="webhook-owner"
                    label="Dueño"
                    extra={
                        <span className="ml-2 text-xs text-gray-500">
                            no cambia después
                        </span>
                    }
                >
                    <Controller
                        name="integrationClientId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                inputId="webhook-owner"
                                isDisabled={isSubmitting}
                                options={ownerOptions}
                                value={
                                    ownerOptions.find(
                                        (o) => o.value === field.value
                                    ) ?? COMPANY
                                }
                                onChange={(option) =>
                                    field.onChange(option?.value ?? null)
                                }
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    asterisk
                    label="Eventos"
                    invalid={!!errors.eventTypes}
                    errorMessage={errors.eventTypes?.message}
                >
                    <Controller
                        name="eventTypes"
                        control={control}
                        render={({ field }) => (
                            <EventTypesField
                                owner={owner}
                                disabled={isSubmitting}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>
                {owner && (
                    <FormItem
                        htmlFor="webhook-excludeOwnChanges"
                        label="Excluir los cambios del propio cliente"
                        extra={
                            <span className="ml-2 text-xs text-gray-500">
                                no recibe lo que causaron sus solicitudes
                            </span>
                        }
                    >
                        <ControlledSwitcher
                            name="excludeOwnChanges"
                            control={control}
                            disabled={isSubmitting}
                        />
                    </FormItem>
                )}
            </FormContainer>
        </form>
    )
}

export default WebhookEndpointCreateForm
