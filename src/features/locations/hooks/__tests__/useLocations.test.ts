import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useLocationsList, useLocationMutations } from '../useLocations'
import * as api from '../../api/client'

vi.mock('../../api/client')

const mockLocation = {
    id: 1,
    warehouseId: 1,
    name: 'Estante A1',
    code: 'EST-A1',
    type: 'storage' as const,
    isActive: true,
    capacity: 100,
}

const mockPaginatedResponse = {
    data: [mockLocation],
    meta: {
        requestId: 'req-1',
        timestamp: '2025-01-01T00:00:00Z',
        pagination: { total: 1, limit: 10, offset: 0 },
    },
}

const mockDataResponse = {
    data: mockLocation,
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

describe('useLocationsList', () => {
    it('returns mapped data with items and pagination', async () => {
        vi.mocked(api.getLocations).mockResolvedValue(mockPaginatedResponse)

        const { result } = renderHook(() => useLocationsList(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].name).toBe('Estante A1')
        expect(result.current.data?.pagination.total).toBe(1)
    })

    it('passes params to getLocations', async () => {
        vi.mocked(api.getLocations).mockResolvedValue(mockPaginatedResponse)
        const params = { limit: 5, offset: 10, warehouseId: 2 }

        const { result } = renderHook(() => useLocationsList(params), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getLocations).toHaveBeenCalledWith(params)
    })
})

describe('useLocationMutations.create', () => {
    it('calls createLocation and returns data', async () => {
        vi.mocked(api.createLocation).mockResolvedValue(mockDataResponse)

        const { result } = renderHook(() => useLocationMutations(), { wrapper })

        result.current.create.mutate({
            warehouseId: 1,
            name: 'Estante A1',
            code: 'EST-A1',
            type: 'storage',
        })

        await waitFor(() => expect(result.current.create.isSuccess).toBe(true))

        expect(api.createLocation).toHaveBeenCalledWith({
            warehouseId: 1,
            name: 'Estante A1',
            code: 'EST-A1',
            type: 'storage',
        })
        expect(result.current.create.data?.name).toBe('Estante A1')
    })
})
