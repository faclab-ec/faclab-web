import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    useSalesList,
    useSale,
    useSaleItems,
    useSalePayments,
    useInvoicesBySale,
} from '../useSales'
import * as api from '../../api/client'

vi.mock('../../api/client')

const META = { requestId: 'req-1', timestamp: '2025-01-01T00:00:00Z' }
const PAGINATION = { total: 1, limit: 10, offset: 0 }

const SALE = {
    id: 1,
    customerId: 10,
    customerName: 'Ana Pérez',
    status: 'CONFIRMED' as const,
    saleDate: '2025-01-15',
    subtotal: 90,
    tax: 10,
    discount: 0,
    total: 100,
    paymentStatus: 'PAID' as const,
    notes: null,
    createdBy: 'admin',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: null,
}

const SALE_ITEM = {
    id: 1,
    saleId: 1,
    productId: 5,
    quantity: 2,
    unitPrice: 45,
    discount: 0,
    taxCode: 'VAT_15' as const,
    taxAmount: 13.5,
    subtotal: 90,
}

const PAYMENT = {
    id: 1,
    saleId: 1,
    amount: 100,
    paymentMethod: 'CASH' as const,
    paymentDate: '2025-01-15',
    reference: null,
    notes: null,
    createdAt: '2025-01-15T10:00:00Z',
}

const INVOICE = {
    id: 'inv-1',
    saleId: '1',
    accessCode: '1234567890',
    status: 'authorized' as const,
    signatureId: 'sig-1',
    statusHistory: [{ name: 'authorized', statusDate: '2025-01-15T10:05:00Z' }],
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

describe('useSalesList', () => {
    it('returns items and pagination', async () => {
        vi.mocked(api.getSales).mockResolvedValue({
            data: [SALE],
            meta: { ...META, pagination: PAGINATION },
        })

        const { result } = renderHook(() => useSalesList(), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.items).toHaveLength(1)
        expect(result.current.data?.items[0].status).toBe('CONFIRMED')
        expect(result.current.data?.pagination.total).toBe(1)
    })

    it('passes params to getSales', async () => {
        vi.mocked(api.getSales).mockResolvedValue({
            data: [],
            meta: { ...META, pagination: { ...PAGINATION, total: 0 } },
        })
        const params = { status: 'DRAFT' as const, limit: 5, offset: 0 }

        const { result } = renderHook(() => useSalesList(params), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.getSales).toHaveBeenCalledWith(params)
    })
})

describe('useSale', () => {
    it('returns a single sale', async () => {
        vi.mocked(api.getSale).mockResolvedValue({ data: SALE, meta: META })

        const { result } = renderHook(() => useSale(1), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.id).toBe(1)
        expect(result.current.data?.total).toBe(100)
    })

    it('is disabled when id is 0', () => {
        const { result } = renderHook(() => useSale(0), { wrapper })

        expect(result.current.fetchStatus).toBe('idle')
        expect(api.getSale).not.toHaveBeenCalled()
    })
})

describe('useSaleItems', () => {
    it('returns sale items array', async () => {
        vi.mocked(api.getSaleItems).mockResolvedValue({
            data: [SALE_ITEM],
            meta: META,
        })

        const { result } = renderHook(() => useSaleItems(1), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data![0].subtotal).toBe(90)
    })
})

describe('useSalePayments', () => {
    it('returns payments array', async () => {
        vi.mocked(api.getSalePayments).mockResolvedValue({
            data: [PAYMENT],
            meta: META,
        })

        const { result } = renderHook(() => useSalePayments(1), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data![0].paymentMethod).toBe('CASH')
    })
})

describe('useInvoicesBySale', () => {
    it('returns invoices for a sale', async () => {
        vi.mocked(api.getInvoicesBySale).mockResolvedValue({
            data: [INVOICE],
            meta: META,
        })

        const { result } = renderHook(() => useInvoicesBySale(1), { wrapper })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data![0].status).toBe('authorized')
    })
})
