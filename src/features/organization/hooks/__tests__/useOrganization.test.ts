import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
    useBranchesList,
    useBranchMutations,
    usePosTerminalMutations,
} from '../useOrganization'
import * as api from '../../api/client'

vi.mock('../../api/client')

const META = { requestId: 'req-1', timestamp: '2026-10-25T00:00:00Z' }

const BRANCH = {
    id: 2,
    establishmentCode: '002',
    name: 'Norte',
    address: null,
    isMain: false,
    isActive: true,
}

let qc: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
    vi.clearAllMocks()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe('useBranchesList', () => {
    it('unwraps items and pagination', async () => {
        vi.mocked(api.getBranches).mockResolvedValue({
            data: [BRANCH],
            meta: { ...META, pagination: { total: 1, limit: 10, offset: 0 } },
        })

        const { result } = renderHook(
            () => useBranchesList({ limit: 10, offset: 0 }),
            { wrapper }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.data?.items).toEqual([BRANCH])
        expect(result.current.data?.pagination?.total).toBe(1)
    })
})

describe('useBranchMutations', () => {
    it('refreshes the session branches after a change', async () => {
        vi.mocked(api.createBranch).mockResolvedValue({
            data: BRANCH,
            meta: META,
        })
        const invalidate = vi.spyOn(qc, 'invalidateQueries')
        const { result } = renderHook(() => useBranchMutations(), { wrapper })

        await act(() =>
            result.current.create.mutateAsync({
                establishmentCode: '002',
                name: 'Norte',
                address: null,
                isActive: true,
            })
        )

        // El selector de sucursal lee /me
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['auth', 'me'] })
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ['organization'],
        })
    })
})

describe('usePosTerminalMutations', () => {
    it('creates the terminal in the branch and refreshes the POS list', async () => {
        vi.mocked(api.createPosTerminal).mockResolvedValue({
            data: {
                id: 5,
                branchId: 2,
                emissionPointId: 3,
                defaultLocationId: 7,
                code: 'CAJA-02',
                name: 'Caja 2',
                isActive: true,
            },
            meta: META,
        })
        const invalidate = vi.spyOn(qc, 'invalidateQueries')
        const { result } = renderHook(() => usePosTerminalMutations(2), {
            wrapper,
        })
        const input = {
            code: 'CAJA-02',
            name: 'Caja 2',
            emissionPointId: 3,
            defaultLocationId: 7,
            isActive: true,
        }

        await act(() => result.current.create.mutateAsync(input))

        expect(api.createPosTerminal).toHaveBeenCalledWith(2, input)
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ['pos', 'terminals'],
        })
    })
})
