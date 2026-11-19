import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import * as api from '../api/client'
import type {
    IntegrationClientInput,
    NewClientSecretInput,
} from '../api/client'
import type {
    IntegrationClientListParams,
    IntegrationUsageParams,
} from '../model/types'

/** Raíz de todo el portal: clientes y webhooks se invalidan juntos (revocar
 *  un cliente desactiva sus webhooks) */
export const INTEGRATIONS_KEY = ['integrations'] as const

export const useIntegrationClients = (params?: IntegrationClientListParams) =>
    useQuery({
        queryKey: [...INTEGRATIONS_KEY, 'clients', params],
        queryFn: async () => {
            const response = await api.getIntegrationClients(params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
        placeholderData: keepPreviousData,
    })

export const useIntegrationClient = (id: number) =>
    useQuery({
        queryKey: [...INTEGRATIONS_KEY, 'clients', id],
        queryFn: async () => (await api.getIntegrationClient(id)).data,
        enabled: id > 0,
    })

export const useIntegrationUsage = (
    id: number,
    params?: IntegrationUsageParams
) =>
    useQuery({
        queryKey: [...INTEGRATIONS_KEY, 'usage', id, params],
        queryFn: async () => (await api.getIntegrationUsage(id, params)).data,
        enabled: id > 0,
        // El uso cambia con cada solicitud del integrador
        staleTime: 30_000,
    })

export const useIntegrationClientMutations = () => {
    const qc = useQueryClient()
    const invalidate = () =>
        qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })

    return {
        create: useMutation({
            mutationFn: (data: IntegrationClientInput) =>
                api.createIntegrationClient(data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        update: useMutation({
            mutationFn: ({
                id,
                data,
            }: {
                id: number
                data: IntegrationClientInput
            }) => api.updateIntegrationClient(id, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        revoke: useMutation({
            mutationFn: (id: number) =>
                api.revokeIntegrationClient(id).then((r) => r.data),
            onSuccess: invalidate,
        }),
        createSecret: useMutation({
            mutationFn: ({
                id,
                data,
            }: {
                id: number
                data: NewClientSecretInput
            }) => api.createClientSecret(id, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        revokeSecret: useMutation({
            mutationFn: ({ id, secretId }: { id: number; secretId: number }) =>
                api.revokeClientSecret(id, secretId).then((r) => r.data),
            onSuccess: invalidate,
        }),
    }
}
