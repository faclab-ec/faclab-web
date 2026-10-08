import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useStockList } from '../useStock'
import * as api from '../../api/client'

vi.mock('../../api/client')

const mockStock = {
    id: 1,
    productId: 5,
    productName: 'Cable HDMI',
    quantity: 42,
    locationId: 3,
    locationName: 'A1',
    reservedQuantity: 0,
}

const mockPaginatedResponse = {
    data: [mockStock],
    meta: {
        requestId: 'req-1',
        timestamp: '2025-01-01T00:00:00Z',
        pagination: { total: 1, limit: 10, offset: 0 },
    },
}

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('useStockList', () => {
    it('returns mapped data with items and pagination', async () => {
        vi.mocked(api.getStock).mockResolvedValue(mockPaginatedResponse)

        const { result } = renderHook(() => useStockList(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].productId).toBe(5)
        expect(result.current.data?.pagination.total).toBe(1)
    })

    it('passes params to getStock', async () => {
        vi.mocked(api.getStock).mockResolvedValue(mockPaginatedResponse)
        const params = { productId: 5, limit: 5, offset: 0 }

        const { result } = renderHook(() => useStockList(params), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getStock).toHaveBeenCalledWith(params)
    })
})
