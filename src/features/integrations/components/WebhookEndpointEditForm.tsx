import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import { FormContainer, FormItem } from '@/components/ui/Form'
import { ControlledSwitcher } from '@/components/ui/Form/controlled'
import {
    webhookEndpointUpdateSchema,
    type WebhookEndpointUpdateFormValues,
} from '../model/schemas'
import EventTypesField from './EventTypesField'
import type { WebhookEndpointUpdateInput } from '../api/client'
import type { IntegrationClient, WebhookEndpoint } from '../model/types'

interface WebhookEndpointEditFormProps {
    formId: string
    endpoint: WebhookEndpoint
    /** Su cliente dueño, si tiene */
    owner: IntegrationClient | null
    isSubmitting?: boolean
    onSubmit: (data: WebhookEndpointUpdateInput) => void
}

/** URL, eventos y descripción de un webhook; el dueño no cambia. */
const WebhookEndpointEditForm = ({
    formId,
    endpoint,
    owner,
    isSubmitting = false,
    onSubmit,
}: WebhookEndpointEditFormProps) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<WebhookEndpointUpdateFormValues>({
        resolver: zodResolver(webhookEndpointUpdateSchema),
        defaultValues: {
            url: endpoint.url,
            description: endpoint.description ?? '',
            eventTypes: endpoint.eventTypes,
            excludeOwnChanges: endpoint.excludeOwnChanges,
        },
    })
    const hasOwner = endpoint.integrationClientId !== null

    return (
        <form
            id={formId}
            onSubmit={handleSubmit((values) =>
                onSubmit({
                    url: values.url.trim(),
                    eventTypes: [...values.eventTypes].sort(),
                    description: values.description.trim() || null,
                    excludeOwnChanges: hasOwner && values.excludeOwnChanges,
                })
            )}
        >
            <FormContainer>
                <FormItem
                    asterisk
                    htmlFor="webhook-edit-url"
                    label="URL"
                    invalid={!!errors.url}
                    errorMessage={errors.url?.message}
                >
                    <Input
                        id="webhook-edit-url"
                        disabled={isSubmitting}
                        invalid={!!errors.url}
                        {...register('url')}
                    />
                </FormItem>
                <FormItem
                    htmlFor="webhook-edit-description"
                    label="Descripción"
                    invalid={!!errors.description}
                    errorMessage={errors.description?.message}
                >
                    <Input
                        id="webhook-edit-description"
                        disabled={isSubmitting}
                        invalid={!!errors.description}
                        {...register('description')}
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
                {hasOwner && (
                    <FormItem
                        htmlFor="webhook-edit-excludeOwnChanges"
                        label="Excluir los cambios del propio cliente"
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

export default WebhookEndpointEditForm
