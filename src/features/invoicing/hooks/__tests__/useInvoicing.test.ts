import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useAuthStore } from '@/stores'
import type { Permission } from '@/constants/permissions.constant'
import {
    useInvoices,
    useInvoicingStatus,
    useRetryInvoice,
} from '../useInvoicing'
import * as api from '../../api/client'
import type { Invoice, InvoicingStatus } from '../../model/types'

vi.mock('../../api/client')

const META = { requestId: 'req-1', timestamp: '2026-10-09T00:00:00Z' }

const NOT_READY: InvoicingStatus = {
    ready: false,
    environment: null,
    certificate: null,
    issues: [
        {
            code: 'CONFIG_MISSING',
            severity: 'error',
            message: 'The company fiscal config has not been saved',
        },
    ],
    pendingInvoices: 2,
    invoicesWithIssues: 2,
}

const PENDING: Invoice = {
    id: 'inv-1',
    saleId: '7',
    accessCode: null,
    status: 'pending',
    signatureId: null,
    statusHistory: [{ name: 'pending', statusDate: '2026-10-09T10:00:00Z' }],
    issue: {
        code: 'CONFIG_MISSING',
        message: 'The company fiscal config has not been saved',
        at: '2026-10-09T10:00:00Z',
    },
    attempts: 1,
    nextAttemptAt: null,
    createdAt: '2026-10-09T10:00:00Z',
    updatedAt: '2026-10-09T10:00:00Z',
}

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return createElement(QueryClientProvider, { client: qc }, children)
}

function signIn(permissions: Permission[]) {
    useAuthStore.getState().setSession({
        id: 1,
        username: 'ana',
        role: 'CASHIER',
        permissions,
        mustChangePassword: false,
    } as never)
}

beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setSession(null)
})

describe('useInvoicingStatus', () => {
    it('returns whether the issuer can invoice', async () => {
        signIn(['sale:read'])
        vi.mocked(api.getInvoicingStatus).mockResolvedValue({
            data: NOT_READY,
            meta: META,
        })

        const { result } = renderHook(() => useInvoicingStatus(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data?.ready).toBe(false)
        expect(result.current.data?.issues[0].code).toBe('CONFIG_MISSING')
    })

    it('does not ask without sale:read', () => {
        signIn([])

        const { result } = renderHook(() => useInvoicingStatus(), { wrapper })

        expect(result.current.fetchStatus).toBe('idle')
        expect(api.getInvoicingStatus).not.toHaveBeenCalled()
    })
})

describe('useInvoices', () => {
    it('asks the server for one page of the invoices that need attention', async () => {
        vi.mocked(api.getInvoices).mockResolvedValue({
            data: [PENDING],
            meta: { ...META, pagination: { total: 11, limit: 10, offset: 10 } },
        })
        const params = { attention: true, limit: 10, offset: 10 }

        const { result } = renderHook(() => useInvoices(params), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(api.getInvoices).toHaveBeenCalledWith(params)
        expect(result.current.data?.items[0].issue?.code).toBe('CONFIG_MISSING')
        expect(result.current.data?.pagination.total).toBe(11)
    })

    it('filters by status on the server', async () => {
        vi.mocked(api.getInvoices).mockResolvedValue({
            data: [],
            meta: { ...META, pagination: { total: 0, limit: 10, offset: 0 } },
        })
        const params = { status: 'rejected' as const, limit: 10, offset: 0 }

        const { result } = renderHook(() => useInvoices(params), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(api.getInvoices).toHaveBeenCalledWith(params)
        expect(result.current.data?.items).toEqual([])
    })
})

describe('useRetryInvoice', () => {
    it('returns the invoice after its next step', async () => {
        vi.mocked(api.retryInvoice).mockResolvedValue({
            data: { ...PENDING, status: 'created', issue: null, attempts: 0 },
            meta: META,
        })

        const { result } = renderHook(() => useRetryInvoice(), { wrapper })
        result.current.mutate('inv-1')

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(api.retryInvoice).toHaveBeenCalledWith('inv-1')
        expect(result.current.data?.status).toBe('created')
    })
})
