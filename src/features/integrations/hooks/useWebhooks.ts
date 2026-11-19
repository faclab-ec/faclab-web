import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import * as api from '../api/client'
import type {
    RotateWebhookSecretInput,
    WebhookEndpointInput,
    WebhookEndpointUpdateInput,
} from '../api/client'
import type {
    WebhookDeliveryListParams,
    WebhookEndpointListParams,
} from '../model/types'
import { INTEGRATIONS_KEY } from './useIntegrations'

const KEY = [...INTEGRATIONS_KEY, 'webhooks'] as const

export const useWebhookEndpoints = (params?: WebhookEndpointListParams) =>
    useQuery({
        queryKey: [...KEY, 'endpoints', params],
        queryFn: async () => {
            const response = await api.getWebhookEndpoints(params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
        placeholderData: keepPreviousData,
    })

export const useWebhookEndpoint = (id: number) =>
    useQuery({
        queryKey: [...KEY, 'endpoints', id],
        queryFn: async () => (await api.getWebhookEndpoint(id)).data,
        enabled: id > 0,
    })

/** Solo cuando se pide: el secreto no se deja en la pantalla ni en caché */
export const useWebhookSecret = (id: number, enabled: boolean) =>
    useQuery({
        queryKey: [...KEY, 'secret', id],
        queryFn: async () => (await api.getWebhookSecret(id)).data,
        enabled: enabled && id > 0,
        staleTime: 0,
        gcTime: 0,
    })

export const useWebhookDeliveries = (
    id: number,
    params?: WebhookDeliveryListParams
) =>
    useQuery({
        queryKey: [...KEY, 'deliveries', id, params],
        queryFn: async () => {
            const response = await api.getWebhookDeliveries(id, params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
        enabled: id > 0,
        placeholderData: keepPreviousData,
        // El worker las envía en segundos: se ve el resultado sin recargar
        refetchInterval: (query) =>
            query.state.data?.items.some((d) => d.status === 'pending')
                ? 5_000
                : false,
    })

export const useWebhookEndpointMutations = () => {
    const qc = useQueryClient()
    const invalidate = () => qc.invalidateQueries({ queryKey: KEY })

    return {
        create: useMutation({
            mutationFn: (data: WebhookEndpointInput) =>
                api.createWebhookEndpoint(data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        update: useMutation({
            mutationFn: ({
                id,
                data,
            }: {
                id: number
                data: WebhookEndpointUpdateInput
            }) => api.updateWebhookEndpoint(id, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        delete: useMutation({
            mutationFn: (id: number) => api.deleteWebhookEndpoint(id),
            onSuccess: invalidate,
        }),
        enable: useMutation({
            mutationFn: (id: number) =>
                api.enableWebhookEndpoint(id).then((r) => r.data),
            onSuccess: invalidate,
        }),
        disable: useMutation({
            mutationFn: (id: number) =>
                api.disableWebhookEndpoint(id).then((r) => r.data),
            onSuccess: invalidate,
        }),
        rotateSecret: useMutation({
            mutationFn: ({
                id,
                data,
            }: {
                id: number
                data: RotateWebhookSecretInput
            }) => api.rotateWebhookSecret(id, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        test: useMutation({
            mutationFn: (id: number) =>
                api.testWebhookEndpoint(id).then((r) => r.data),
            onSuccess: invalidate,
        }),
        retry: useMutation({
            mutationFn: ({
                id,
                deliveryId,
            }: {
                id: number
                deliveryId: number
            }) => api.retryWebhookDelivery(id, deliveryId).then((r) => r.data),
            onSuccess: invalidate,
        }),
    }
}
