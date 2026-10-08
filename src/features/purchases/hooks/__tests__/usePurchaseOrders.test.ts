import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    usePurchaseOrders,
    usePurchaseOrder,
    usePurchaseOrderItems,
    usePurchaseOrderReceipts,
} from '../usePurchaseOrders'
import * as api from '../../api/client'

vi.mock('../../api/client')

const META = { requestId: 'req-1', timestamp: '2025-01-01T00:00:00Z' }
const PAGINATION = { total: 2, limit: 10, offset: 0 }

const ORDER = {
    id: 1,
    supplierId: 10,
    supplierName: 'Distribuidora Andina',
    orderNumber: 'PO-001',
    status: 'draft' as const,
    subtotal: 90,
    tax: 10,
    total: 100,
    notes: null,
    expectedDate: null,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: null,
}

const ITEM = {
    id: 1,
    purchaseOrderId: 1,
    productId: 5,
    quantityOrdered: 10,
    quantityReceived: 0,
    unitCost: 9,
}

const RECEIPT = {
    id: 1,
    purchaseOrderId: 1,
    notes: null,
    receivedAt: '2025-01-20T00:00:00Z',
    createdAt: '2025-01-20T08:00:00Z',
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

describe('usePurchaseOrders', () => {
    it('returns items and pagination', async () => {
        vi.mocked(api.getPurchaseOrders).mockResolvedValue({
            data: [ORDER],
            meta: { ...META, pagination: PAGINATION },
        })

        const { result } = renderHook(() => usePurchaseOrders(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].orderNumber).toBe('PO-001')
        expect(result.current.data?.pagination.total).toBe(2)
    })

    it('passes params to getPurchaseOrders', async () => {
        vi.mocked(api.getPurchaseOrders).mockResolvedValue({
            data: [],
            meta: { ...META, pagination: { ...PAGINATION, total: 0 } },
        })
        const params = { status: 'sent' as const, limit: 5, offset: 0 }

        const { result } = renderHook(() => usePurchaseOrders(params), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getPurchaseOrders).toHaveBeenCalledWith(params)
    })
})

describe('usePurchaseOrder', () => {
    it('returns a single order', async () => {
        vi.mocked(api.getPurchaseOrder).mockResolvedValue({
            data: ORDER,
            meta: META,
        })

        const { result } = renderHook(() => usePurchaseOrder(1), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.id).toBe(1)
        expect(result.current.data?.status).toBe('draft')
    })

    it('is disabled when id is 0', () => {
        const { result } = renderHook(() => usePurchaseOrder(0), { wrapper })

        expect(result.current.fetchStatus).toBe('idle')
        expect(api.getPurchaseOrder).not.toHaveBeenCalled()
    })
})

describe('usePurchaseOrderItems', () => {
    it('returns items array', async () => {
        vi.mocked(api.getPurchaseOrderItems).mockResolvedValue({
            data: [ITEM],
            meta: META,
        })

        const { result } = renderHook(() => usePurchaseOrderItems(1), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data![0].quantityOrdered).toBe(10)
    })

    it('is disabled when orderId is 0', () => {
        const { result } = renderHook(() => usePurchaseOrderItems(0), {
            wrapper,
        })

        expect(result.current.fetchStatus).toBe('idle')
        expect(api.getPurchaseOrderItems).not.toHaveBeenCalled()
    })
})

describe('usePurchaseOrderReceipts', () => {
    it('returns receipts array', async () => {
        vi.mocked(api.getPurchaseOrderReceipts).mockResolvedValue({
            data: [RECEIPT],
            meta: META,
        })

        const { result } = renderHook(() => usePurchaseOrderReceipts(1), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data![0].id).toBe(1)
    })

    it('is disabled when orderId is 0', () => {
        const { result } = renderHook(() => usePurchaseOrderReceipts(0), {
            wrapper,
        })

        expect(result.current.fetchStatus).toBe('idle')
        expect(api.getPurchaseOrderReceipts).not.toHaveBeenCalled()
    })
})
