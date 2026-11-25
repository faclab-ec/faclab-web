import { createElement } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api/client'
import { usePlatformLogin, useSuspendTenant } from '../hooks/usePlatform'
import { usePlatformStore } from '../store/usePlatformStore'

vi.mock('../api/client')

const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(
        QueryClientProvider,
        {
            client: new QueryClient({
                defaultOptions: { queries: { retry: false } },
            }),
        },
        children
    )

describe('the platform console session', () => {
    beforeEach(() => {
        usePlatformStore.getState().clear()
        vi.resetAllMocks()
    })

    it('keeps the operator token in memory after the login', async () => {
        vi.mocked(api.platformLogin).mockResolvedValue({
            data: {
                accessToken: 'tok',
                expiresIn: 900,
                tokenType: 'Bearer',
                username: 'ops',
                displayName: 'Ops',
            },
            meta: { requestId: 'r', timestamp: 't' },
        })

        const { result } = renderHook(() => usePlatformLogin(), { wrapper })
        result.current.mutate({ username: 'ops', password: 'x' })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        const state = usePlatformStore.getState()
        expect(state.accessToken).toBe('tok')
        expect(state.operatorName).toBe('Ops')
        expect(state.expiresAt).toBeGreaterThan(Date.now())
        // Nothing of it reaches the browser's storage
        expect(JSON.stringify({ ...localStorage })).not.toContain('tok')
    })

    it('leaves the session empty when the login fails', async () => {
        vi.mocked(api.platformLogin).mockRejectedValue(new Error('no'))

        const { result } = renderHook(() => usePlatformLogin(), { wrapper })
        result.current.mutate({ username: 'ops', password: 'bad' })

        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(usePlatformStore.getState().accessToken).toBeNull()
    })

    it('suspends a company with its reason', async () => {
        vi.mocked(api.suspendTenant).mockResolvedValue({
            data: { status: 'suspended', revokedSessions: 2 },
            meta: { requestId: 'r', timestamp: 't' },
        })

        const { result } = renderHook(() => useSuspendTenant(), { wrapper })
        result.current.mutate({ id: 't1', reason: 'falta de pago' })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(api.suspendTenant).toHaveBeenCalledWith('t1', 'falta de pago')
    })
})
