import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useSubscription } from '../useSubscription'
import * as api from '../../api/client'
import type { Subscription } from '../../model/types'

vi.mock('../../api/client')

const SUBSCRIPTION: Subscription = {
    plan: {
        code: 'basico',
        name: 'Básico',
        publicApi: false,
        maxBranches: 1,
        maxTerminals: 2,
        maxUsers: 3,
        maxIntegrationClients: 0,
        maxWebhookEndpoints: 0,
        maxMonthlyDocuments: 300,
    },
    status: 'active',
    trialEndsAt: null,
    readOnly: false,
    resources: [{ resource: 'branches', used: 1, limit: 1 }],
    documents: {
        limit: 300,
        months: [
            { period: '2026-11-01', invoices: 4, creditNotes: 1, total: 5 },
        ],
    },
}

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useSubscription', () => {
    beforeEach(() => vi.clearAllMocks())

    it('unwraps the plan and its usage', async () => {
        vi.mocked(api.getSubscription).mockResolvedValue({
            data: SUBSCRIPTION,
            meta: { requestId: 'req-1', timestamp: '2026-11-24T00:00:00Z' },
        })

        const { result } = renderHook(() => useSubscription(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data).toEqual(SUBSCRIPTION)
    })
})
