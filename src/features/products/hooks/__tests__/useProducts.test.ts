import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useProductsList, useProductMutations } from '../useProducts'
import * as api from '../../api/client'

vi.mock('../../api/client')

const mockProduct = {
    id: 1,
    name: 'Producto X',
    sku: 'SKU-001',
    description: null,
    barcode: null,
    categoryId: null,
    unitOfMeasureId: null,
    purchasePrice: null,
    salePrice: null,
    taxCode: 'VAT_15' as const,
    isActive: true,
    isService: false,
    minStock: 0,
    maxStock: null,
    reorderPoint: 0,
    leadTimeDays: null,
}

const mockPaginatedResponse = {
    data: [mockProduct],
    meta: {
        requestId: 'req-1',
        timestamp: '2025-01-01T00:00:00Z',
        pagination: { total: 1, limit: 10, offset: 0 },
    },
}

const mockDataResponse = {
    data: mockProduct,
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

describe('useProductsList', () => {
    it('returns mapped data with items and pagination', async () => {
        vi.mocked(api.getProducts).mockResolvedValue(mockPaginatedResponse)

        const { result } = renderHook(() => useProductsList(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].sku).toBe('SKU-001')
        expect(result.current.data?.pagination.total).toBe(1)
    })

    it('passes params to getProducts', async () => {
        vi.mocked(api.getProducts).mockResolvedValue(mockPaginatedResponse)
        const params = { limit: 5, offset: 10, categoryId: 3 }

        const { result } = renderHook(() => useProductsList(params), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getProducts).toHaveBeenCalledWith(params)
    })
})

describe('useProductMutations.create', () => {
    it('calls createProduct and returns data', async () => {
        vi.mocked(api.createProduct).mockResolvedValue(mockDataResponse)

        const { result } = renderHook(() => useProductMutations(), { wrapper })

        result.current.create.mutate({ name: 'Producto X', sku: 'SKU-001' })

        await waitFor(() => expect(result.current.create.isSuccess).toBe(true))

        expect(api.createProduct).toHaveBeenCalledWith({
            name: 'Producto X',
            sku: 'SKU-001',
        })
        expect(result.current.create.data?.sku).toBe('SKU-001')
    })
})
