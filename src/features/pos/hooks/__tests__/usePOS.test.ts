import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useQuickSale, useProcessRefund } from '../usePOS'
import * as api from '../../api/client'
import { ApiError } from '@/utils/errors/ApiError'
import type { POSSale, QuickSaleInput, Refund } from '../../model/types'

vi.mock('../../api/client')

const meta = { requestId: 'req-1', timestamp: '2026-10-25T00:00:00Z' }
const sale = { id: 7 } as POSSale
const input: QuickSaleInput = {
    items: [{ productId: 1, quantity: 1 }],
    payments: [{ amount: 11.5, paymentMethod: 'CASH' }],
}

const networkError = () =>
    new ApiError({ code: 'ERR_NETWORK', message: 'Network Error', status: 0 })
const keyReused = () =>
    new ApiError({
        code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'used',
        status: 422,
    })

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } })
    return createElement(QueryClientProvider, { client: qc }, children)
}

/** La clave (último argumento) de cada llamada al cliente */
const keysOf = (mock: { mock: { calls: unknown[][] } }) =>
    mock.mock.calls.map((call) => call[call.length - 1])

const attempt = async (run: () => Promise<unknown>) => {
    await act(async () => {
        await run().catch(() => undefined)
    })
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('useQuickSale: una clave por operación', () => {
    it('reintenta con la misma clave después de un fallo de red', async () => {
        vi.mocked(api.quickSale)
            .mockRejectedValueOnce(networkError())
            .mockResolvedValueOnce({ data: sale, meta })
        const { result } = renderHook(() => useQuickSale(), { wrapper })

        await attempt(() => result.current.mutateAsync(input))
        await attempt(() => result.current.mutateAsync(input))

        const [first, second] = keysOf(vi.mocked(api.quickSale))
        expect(first).toMatch(/^[0-9a-f-]{36}$/)
        expect(second).toBe(first)
    })

    it('la siguiente venta lleva otra clave', async () => {
        vi.mocked(api.quickSale).mockResolvedValue({ data: sale, meta })
        const { result } = renderHook(() => useQuickSale(), { wrapper })

        await attempt(() => result.current.mutateAsync(input))
        await attempt(() => result.current.mutateAsync(input))

        const [first, second] = keysOf(vi.mocked(api.quickSale))
        expect(second).not.toBe(first)
    })

    it('si la clave ya se registró con otros datos, la próxima es otra', async () => {
        vi.mocked(api.quickSale)
            .mockRejectedValueOnce(networkError())
            .mockRejectedValueOnce(keyReused())
            .mockResolvedValueOnce({ data: sale, meta })
        const { result } = renderHook(() => useQuickSale(), { wrapper })

        await attempt(() => result.current.mutateAsync(input))
        await attempt(() => result.current.mutateAsync(input))
        await attempt(() => result.current.mutateAsync(input))

        const [first, second, third] = keysOf(vi.mocked(api.quickSale))
        expect(second).toBe(first)
        expect(third).not.toBe(first)
    })
})

describe('useProcessRefund', () => {
    it('envía la clave de la operación y la conserva tras un fallo', async () => {
        vi.mocked(api.processRefund)
            .mockRejectedValueOnce(networkError())
            .mockResolvedValueOnce({ data: { id: 3 } as Refund, meta })
        const { result } = renderHook(() => useProcessRefund(), { wrapper })
        const variables = {
            refundId: 3,
            data: {
                payments: [{ amount: 11.5, paymentMethod: 'CASH' as const }],
            },
        }

        await attempt(() => result.current.mutateAsync(variables))
        await attempt(() => result.current.mutateAsync(variables))

        const calls = vi.mocked(api.processRefund).mock.calls
        expect(calls[0].slice(0, 2)).toEqual([3, variables.data])
        expect(calls[1][2]).toBe(calls[0][2])
    })
})
