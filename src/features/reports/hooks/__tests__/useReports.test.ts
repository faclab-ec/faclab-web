import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    useValuation,
    useRotation,
    useMovementHistory,
    useWarehouseSummary,
} from '../useReports'
import * as api from '../../api/client'

vi.mock('../../api/client')

const META = { requestId: 'req-1', timestamp: '2025-01-01T00:00:00Z' }

const mockValuationResponse = {
    data: {
        totalValue: 15000,
        asOfDate: '2025-01-01',
        items: [
            {
                productId: 1,
                productName: 'Producto A',
                sku: 'SKU-001',
                quantity: 10,
                averageCost: 500,
                totalValue: 5000,
            },
        ],
    },
    meta: META,
}

const mockRotationResponse = {
    data: [
        {
            productId: 1,
            productName: 'Producto A',
            sku: 'SKU-001',
            totalIn: 100,
            totalOut: 80,
            currentStock: 20,
            turnoverRate: 4.0,
            daysOfStock: 15,
        },
    ],
    meta: META,
}

const mockMovementsResponse = {
    data: [
        {
            id: 1,
            productId: 1,
            productName: 'Producto A',
            sku: 'SKU-001',
            quantity: 10,
            type: 'IN' as const,
            locationId: null,
            sourceLocationId: null,
            referenceType: 'purchase_order',
            referenceId: 42,
            reason: null,
            date: '2025-01-01T10:00:00Z',
            createdAt: '2025-01-01T10:00:00Z',
        },
    ],
    meta: {
        ...META,
        pagination: { total: 1, limit: 50, offset: 0 },
    },
}

const mockSummaryResponse = {
    data: [
        {
            warehouseId: 1,
            warehouseName: 'Bodega Central',
            warehouseCode: 'BOD-001',
            totalProducts: 5,
            totalQuantity: 100,
            reservedQuantity: 10,
            availableQuantity: 90,
            totalValue: 15000,
        },
    ],
    meta: META,
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

describe('useValuation', () => {
    it('returns inventory valuation data', async () => {
        vi.mocked(api.getValuation).mockResolvedValue(mockValuationResponse)

        const { result } = renderHook(() => useValuation(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.totalValue).toBe(15000)
        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].productName).toBe('Producto A')
    })

    it('passes params to getValuation', async () => {
        vi.mocked(api.getValuation).mockResolvedValue(mockValuationResponse)
        const params = { warehouseId: 1, asOfDate: '2025-01-01' }

        const { result } = renderHook(() => useValuation(params), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getValuation).toHaveBeenCalledWith(params)
    })
})

describe('useRotation', () => {
    it('returns product rotation array', async () => {
        vi.mocked(api.getRotation).mockResolvedValue(mockRotationResponse)

        const { result } = renderHook(() => useRotation(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data![0].turnoverRate).toBe(4.0)
        expect(result.current.data![0].daysOfStock).toBe(15)
    })

    it('passes params to getRotation', async () => {
        vi.mocked(api.getRotation).mockResolvedValue(mockRotationResponse)
        const params = {
            warehouseId: 2,
            fromDate: '2025-01-01',
            toDate: '2025-01-31',
        }

        const { result } = renderHook(() => useRotation(params), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getRotation).toHaveBeenCalledWith(params)
    })
})

describe('useMovementHistory', () => {
    it('returns items and pagination', async () => {
        vi.mocked(api.getMovementHistory).mockResolvedValue(
            mockMovementsResponse
        )

        const { result } = renderHook(() => useMovementHistory(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].type).toBe('IN')
        expect(result.current.data?.pagination.total).toBe(1)
    })

    it('passes pagination params to getMovementHistory', async () => {
        vi.mocked(api.getMovementHistory).mockResolvedValue(
            mockMovementsResponse
        )
        const params = { limit: 20, offset: 40, warehouseId: 1 }

        const { result } = renderHook(() => useMovementHistory(params), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getMovementHistory).toHaveBeenCalledWith(params)
    })
})

describe('useWarehouseSummary', () => {
    it('returns warehouse summary array', async () => {
        vi.mocked(api.getWarehouseSummary).mockResolvedValue(
            mockSummaryResponse
        )

        const { result } = renderHook(() => useWarehouseSummary(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data![0].warehouseName).toBe('Bodega Central')
        expect(result.current.data![0].availableQuantity).toBe(90)
    })

    it('passes warehouseId filter to getWarehouseSummary', async () => {
        vi.mocked(api.getWarehouseSummary).mockResolvedValue(
            mockSummaryResponse
        )
        const params = { warehouseId: 1 }

        const { result } = renderHook(() => useWarehouseSummary(params), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getWarehouseSummary).toHaveBeenCalledWith(params)
    })
})
