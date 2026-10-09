import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLogout } from '../useAuth'
import * as api from '../../api/client'

vi.mock('../../api/client')
vi.mock('@shared/lib/auth/navigationRef', () => ({ navigateTo: vi.fn() }))

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
    })
    return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore
        .getState()
        .setTokens({ accessToken: 'a', refreshToken: 'r', expiresIn: 900 })
})

describe('useLogout', () => {
    it('revokes the session on the server and clears the local one', async () => {
        vi.mocked(api.apiLogout).mockResolvedValue(undefined as never)
        const { result } = renderHook(() => useLogout(), { wrapper })

        await act(() => result.current.mutateAsync())

        expect(api.apiLogout).toHaveBeenCalledWith('r')
        expect(useAuthStore.getState().refreshToken).toBeNull()
    })

    it('clears the local session even if the server call fails', async () => {
        vi.mocked(api.apiLogout).mockRejectedValue(new Error('offline'))
        const { result } = renderHook(() => useLogout(), { wrapper })

        await act(() => result.current.mutateAsync())

        expect(useAuthStore.getState().accessToken).toBeNull()
    })
})
