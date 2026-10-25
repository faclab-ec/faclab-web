import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROLE } from '@/constants/roles.constant'
import { navigateTo } from '@shared/lib/auth/navigationRef'
import type { Session, TenantSummary, TokenPair } from '@/@types/auth'
import { useLogin, useSelectTenant, useSwitchTenant } from '../useAuth'
import * as api from '../../api/client'

vi.mock('../../api/client')
vi.mock('@shared/lib/auth/navigationRef', () => ({ navigateTo: vi.fn() }))
vi.mock('../../lib/refreshScheduler', () => ({
    refreshScheduler: { start: vi.fn(), stop: vi.fn() },
}))

const TENANT_A: TenantSummary = {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    ruc: '0190000000001',
    legalName: 'Ferretería A',
    tradeName: null,
}
const TENANT_B: TenantSummary = {
    id: 'bbbbbbbb-0000-4000-8000-000000000002',
    ruc: '0190000000002',
    legalName: 'Ferretería B',
    tradeName: 'La B',
}

const sessionIn = (tenant: TenantSummary): Session => ({
    id: 7,
    username: 'ana',
    fullName: null,
    role: ROLE.ADMIN,
    permissions: [],
    mustChangePassword: false,
    tenant,
    tenants: [
        { ...TENANT_A, role: ROLE.ADMIN },
        { ...TENANT_B, role: ROLE.ADMIN },
    ],
    branches: [],
})

const pair = (accessToken: string, tenant: TenantSummary): TokenPair => ({
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    tenant,
})

const envelope = <T>(data: T) => ({
    data,
    meta: { requestId: 'req-1', timestamp: '2026-10-25T00:00:00Z' },
})

let qc: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().clear()
    qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
})

describe('useLogin', () => {
    it('with one company opens the session right away', async () => {
        vi.mocked(api.apiLogin).mockResolvedValue(
            envelope(pair('at-a', TENANT_A))
        )
        vi.mocked(api.apiMe).mockResolvedValue(envelope(sessionIn(TENANT_A)))
        const { result } = renderHook(() => useLogin(), { wrapper })

        const outcome = await act(() =>
            result.current.mutateAsync({ username: 'ana', password: 'x' })
        )

        expect(outcome.status).toBe('signed-in')
        // /me se lee con el token nuevo antes de guardarlo
        expect(api.apiMe).toHaveBeenCalledWith('at-a')
        expect(useAuthStore.getState().accessToken).toBe('at-a')
        expect(useAuthStore.getState().session?.tenant.id).toBe(TENANT_A.id)
    })

    it('with several companies returns the choice and opens nothing', async () => {
        vi.mocked(api.apiLogin).mockResolvedValue(
            envelope({
                selectionToken: 'sel',
                expiresIn: 300,
                tenants: sessionIn(TENANT_A).tenants,
            })
        )
        const { result } = renderHook(() => useLogin(), { wrapper })

        const outcome = await act(() =>
            result.current.mutateAsync({ username: 'ana', password: 'x' })
        )

        expect(outcome).toEqual({
            status: 'select-tenant',
            selectionToken: 'sel',
            tenants: sessionIn(TENANT_A).tenants,
        })
        expect(api.apiMe).not.toHaveBeenCalled()
        expect(useAuthStore.getState().accessToken).toBeNull()
        // Nada del token de selección queda en el navegador
        expect(JSON.stringify(Object.entries(localStorage))).not.toContain(
            'sel'
        )
    })
})

describe('useSelectTenant', () => {
    it('opens the session in the chosen company with the selection token', async () => {
        vi.mocked(api.apiSelectTenant).mockResolvedValue(
            envelope(pair('at-b', TENANT_B))
        )
        vi.mocked(api.apiMe).mockResolvedValue(envelope(sessionIn(TENANT_B)))
        const { result } = renderHook(() => useSelectTenant(), { wrapper })

        await act(() =>
            result.current.mutateAsync({
                tenantId: TENANT_B.id,
                selectionToken: 'sel',
            })
        )

        expect(api.apiSelectTenant).toHaveBeenCalledWith(
            { tenantId: TENANT_B.id },
            'sel'
        )
        expect(useAuthStore.getState().accessToken).toBe('at-b')
        expect(useAuthStore.getState().session?.tenant.id).toBe(TENANT_B.id)
    })
})

describe('useSwitchTenant', () => {
    beforeEach(() => {
        useAuthStore
            .getState()
            .signIn(
                { accessToken: 'at-a', expiresIn: 900 },
                sessionIn(TENANT_A)
            )
    })

    it('drops what was loaded and enters the other company', async () => {
        qc.setQueryData(['products', 'list'], ['de la empresa A'])
        vi.mocked(api.apiSelectTenant).mockResolvedValue(
            envelope(pair('at-b', TENANT_B))
        )
        vi.mocked(api.apiMe).mockResolvedValue(envelope(sessionIn(TENANT_B)))
        const { result } = renderHook(() => useSwitchTenant(), { wrapper })

        await act(() => result.current.mutateAsync(TENANT_B.id))

        // Con el access token vigente (lo pone el interceptor), sin selección
        expect(api.apiSelectTenant).toHaveBeenCalledWith({
            tenantId: TENANT_B.id,
        })
        expect(qc.getQueryData(['products', 'list'])).toBeUndefined()
        expect(useAuthStore.getState().accessToken).toBe('at-b')
        expect(useAuthStore.getState().session?.tenant.id).toBe(TENANT_B.id)
        expect(navigateTo).toHaveBeenCalledWith('/home', { replace: true })
    })

    it('keeps the current company when the switch is refused', async () => {
        qc.setQueryData(['products', 'list'], ['de la empresa A'])
        vi.mocked(api.apiSelectTenant).mockRejectedValue(
            new Error('TENANT_ACCESS_DENIED')
        )
        const { result } = renderHook(() => useSwitchTenant(), { wrapper })

        await act(() =>
            result.current.mutateAsync(TENANT_B.id).catch(() => undefined)
        )

        expect(qc.getQueryData(['products', 'list'])).toEqual([
            'de la empresa A',
        ])
        expect(useAuthStore.getState().accessToken).toBe('at-a')
        expect(navigateTo).not.toHaveBeenCalled()
    })
})
