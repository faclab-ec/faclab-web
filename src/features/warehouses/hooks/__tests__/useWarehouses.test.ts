import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useWarehousesList, useWarehouseMutations } from '../useWarehouses'
import * as api from '../../api/client'

vi.mock('../../api/client')

const mockWarehouse = {
    id: 1,
    branchId: 1,
    name: 'Bodega Central',
    code: 'BOD-001',
    address: null,
    city: 'Quito',
    country: 'Ecuador',
    isActive: true,
    isDefault: true,
    manager: null,
    phone: null,
    email: null,
}

const mockPaginatedResponse = {
    data: [mockWarehouse],
    meta: {
        requestId: 'req-1',
        timestamp: '2025-01-01T00:00:00Z',
        pagination: { total: 1, limit: 10, offset: 0 },
    },
}

const mockDataResponse = {
    data: mockWarehouse,
    meta: { requestId: 'req-1', timestamp: '2025-01-01T00:00:00Z' },
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

describe('useWarehousesList', () => {
    it('returns mapped data with items and pagination', async () => {
        vi.mocked(api.getWarehouses).mockResolvedValue(mockPaginatedResponse)

        const { result } = renderHook(() => useWarehousesList(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].name).toBe('Bodega Central')
        expect(result.current.data?.pagination.total).toBe(1)
    })

    it('passes params to getWarehouses', async () => {
        vi.mocked(api.getWarehouses).mockResolvedValue(mockPaginatedResponse)
        const params = { limit: 5, offset: 10 }

        const { result } = renderHook(() => useWarehousesList(params), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getWarehouses).toHaveBeenCalledWith(params)
    })
})

describe('useWarehouseMutations.create', () => {
    it('calls createWarehouse and returns data', async () => {
        vi.mocked(api.createWarehouse).mockResolvedValue(mockDataResponse)

        const { result } = renderHook(() => useWarehouseMutations(), {
            wrapper,
        })

        result.current.create.mutate({
            branchId: 1,
            name: 'Bodega Central',
            code: 'BOD-001',
        })

        await waitFor(() => expect(result.current.create.isSuccess).toBe(true))

        expect(api.createWarehouse).toHaveBeenCalledWith({
            branchId: 1,
            name: 'Bodega Central',
            code: 'BOD-001',
        })
        expect(result.current.create.data?.name).toBe('Bodega Central')
    })
})
