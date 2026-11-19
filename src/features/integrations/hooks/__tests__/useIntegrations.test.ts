import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    INTEGRATIONS_KEY,
    useIntegrationClientMutations,
    useIntegrationClients,
} from '../useIntegrations'
import {
    useWebhookDeliveries,
    useWebhookEndpointMutations,
} from '../useWebhooks'
import * as api from '../../api/client'
import type {
    CreatedIntegrationClient,
    WebhookDelivery,
} from '../../model/types'

vi.mock('../../api/client')

const META = { requestId: 'req-1', timestamp: '2026-11-18T00:00:00Z' }

const CLIENT: CreatedIntegrationClient = {
    id: 4,
    clientId: 'fl_test_3f2a9c1b0d4e',
    name: 'Tienda en línea',
    environment: 'sandbox',
    status: 'ACTIVE',
    scopes: ['products:read', 'sales:write'],
    branchIds: null,
    allowedIps: null,
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-18T10:00:00Z',
    revokedAt: null,
    lastUsedAt: null,
    secrets: [],
    clientSecret: 'secreto-de-prueba',
}

const DELIVERY: WebhookDelivery = {
    id: 9,
    endpointId: 2,
    messageId: 'msg_1',
    eventType: 'webhook.test',
    occurredAt: '2026-11-18T10:00:00Z',
    status: 'pending',
    attempts: 0,
    nextAttemptAt: '2026-11-18T10:00:05Z',
    lastAttemptAt: null,
    responseStatus: null,
    lastError: null,
    durationMs: null,
    deliveredAt: null,
    retriedAt: null,
    createdAt: '2026-11-18T10:00:00Z',
}

let qc: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
    vi.clearAllMocks()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe('useIntegrationClients', () => {
    it('unwraps items and pagination', async () => {
        vi.mocked(api.getIntegrationClients).mockResolvedValue({
            data: [CLIENT],
            meta: { ...META, pagination: { total: 1, limit: 10, offset: 0 } },
        })

        const { result } = renderHook(
            () => useIntegrationClients({ status: 'ACTIVE', limit: 10 }),
            { wrapper }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data?.items).toEqual([CLIENT])
        expect(api.getIntegrationClients).toHaveBeenCalledWith({
            status: 'ACTIVE',
            limit: 10,
        })
    })
})

describe('useIntegrationClientMutations', () => {
    it('returns the secret once and refreshes the whole portal', async () => {
        vi.mocked(api.createIntegrationClient).mockResolvedValue({
            data: CLIENT,
            meta: META,
        })
        const invalidate = vi.spyOn(qc, 'invalidateQueries')
        const { result } = renderHook(() => useIntegrationClientMutations(), {
            wrapper,
        })

        let created: CreatedIntegrationClient | undefined
        await act(async () => {
            created = await result.current.create.mutateAsync({
                name: 'Tienda en línea',
                scopes: ['products:read'],
                branchIds: null,
                allowedIps: null,
            })
        })

        expect(created?.clientSecret).toBe('secreto-de-prueba')
        expect(invalidate).toHaveBeenCalledWith({ queryKey: INTEGRATIONS_KEY })
    })

    it('sends how long the previous secrets keep working', async () => {
        vi.mocked(api.createClientSecret).mockResolvedValue({
            data: {
                id: 2,
                prefix: 'abc123',
                isActive: true,
                createdAt: '2026-11-18T10:00:00Z',
                expiresAt: null,
                revokedAt: null,
                lastUsedAt: null,
                clientSecret: 'otro',
            },
            meta: META,
        })
        const { result } = renderHook(() => useIntegrationClientMutations(), {
            wrapper,
        })

        await act(async () => {
            await result.current.createSecret.mutateAsync({
                id: 4,
                data: { previousExpiresInDays: 7 },
            })
        })

        expect(api.createClientSecret).toHaveBeenCalledWith(4, {
            previousExpiresInDays: 7,
        })
    })
})

describe('useWebhookEndpointMutations', () => {
    it('a test delivery refreshes the endpoints and their deliveries', async () => {
        vi.mocked(api.testWebhookEndpoint).mockResolvedValue({
            data: DELIVERY,
            meta: META,
        })
        const invalidate = vi.spyOn(qc, 'invalidateQueries')
        const { result } = renderHook(() => useWebhookEndpointMutations(), {
            wrapper,
        })

        await act(async () => {
            await result.current.test.mutateAsync(2)
        })

        expect(invalidate).toHaveBeenCalledWith({
            queryKey: [...INTEGRATIONS_KEY, 'webhooks'],
        })
    })
})

describe('useWebhookDeliveries', () => {
    it('passes the filters and the endpoint', async () => {
        vi.mocked(api.getWebhookDeliveries).mockResolvedValue({
            data: [DELIVERY],
            meta: { ...META, pagination: { total: 1, limit: 20, offset: 0 } },
        })

        const { result } = renderHook(
            () =>
                useWebhookDeliveries(2, {
                    status: 'pending',
                    limit: 20,
                    offset: 0,
                }),
            { wrapper }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(api.getWebhookDeliveries).toHaveBeenCalledWith(2, {
            status: 'pending',
            limit: 20,
            offset: 0,
        })
        expect(result.current.data?.items[0].messageId).toBe('msg_1')
    })
})
