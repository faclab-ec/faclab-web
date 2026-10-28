import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useAuditLog } from '../useAuditLog'
import * as api from '../../api/client'
import type { AuditEntry } from '../../model/types'

vi.mock('../../api/client')

const META = { requestId: 'req-1', timestamp: '2026-10-28T00:00:00Z' }
const PAGINATION = { total: 1, limit: 10, offset: 0 }

const ENTRY: AuditEntry = {
    id: 7,
    occurredAt: '2026-10-28T09:30:00',
    actorUserId: 3,
    actorName: 'Caja Uno',
    action: 'sale.cancelled',
    resourceType: 'sale',
    resourceId: 41,
    branchId: 1,
    source: 'request',
    requestId: '6f1c3d1e-6b1a-4a43-9d0e-6a7f2f6b9e51',
    before: { status: 'CONFIRMED', total: '11.500000' },
    after: { status: 'CANCELLED', reason: 'Error de cobro' },
}

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useAuditLog', () => {
    beforeEach(() => vi.clearAllMocks())

    it('unwraps the entries and the pagination', async () => {
        vi.mocked(api.listAuditLog).mockResolvedValue({
            data: [ENTRY],
            meta: { ...META, pagination: PAGINATION },
        })
        const params = {
            action: 'sale.cancelled' as const,
            actorId: 3,
            fromDate: '2026-10-01',
            limit: 10,
            offset: 0,
        }

        const { result } = renderHook(() => useAuditLog(params), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(api.listAuditLog).toHaveBeenCalledWith(params)
        expect(result.current.data).toEqual({
            items: [ENTRY],
            pagination: PAGINATION,
        })
    })
})
