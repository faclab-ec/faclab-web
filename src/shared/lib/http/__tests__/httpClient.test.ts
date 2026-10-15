import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError } from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { httpClient } from '../httpClient'
import { useAuthStore } from '@/stores/useAuthStore'
import { navigateTo } from '@shared/lib/auth/navigationRef'
import { isApiError, type ApiError } from '@/utils/errors/ApiError'

vi.mock('@shared/lib/auth/navigationRef', () => ({
    navigateTo: vi.fn(),
}))

type Reply = { status: number; data?: unknown }

const errorBody = (code: string, message = code) => ({
    errors: [{ code, message, field: null }],
    meta: { requestId: 'req-1', timestamp: '2026-01-01T00:00:00Z' },
})

/**
 * Adapter falso de axios: responde en orden con `replies` y guarda el header
 * Authorization de cada llamada. Va en la config de la request, así que
 * también lo usa el reintento tras el refresh.
 */
const makeAdapter = (...replies: Reply[]) => {
    const authHeaders: (string | undefined)[] = []
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
        authHeaders.push(config.headers.get('Authorization') as string)
        const reply = replies.shift() ?? { status: 200, data: {} }
        const response = {
            data: reply.data,
            status: reply.status,
            statusText: '',
            headers: {},
            config,
        } as AxiosResponse
        if (reply.status >= 400) {
            throw new AxiosError(
                'Request failed',
                AxiosError.ERR_BAD_REQUEST,
                config,
                {},
                response
            )
        }
        return response
    })
    return { adapter, authHeaders }
}

const newTokens = {
    accessToken: 'new-at',
    expiresIn: 900,
    tokenType: 'Bearer' as const,
}

const mockNavigate = vi.mocked(navigateTo)

describe('httpClient', () => {
    beforeEach(() => {
        useAuthStore.getState().setTokens({
            accessToken: 'old-at',
            expiresIn: 900,
        })
    })

    afterEach(() => {
        useAuthStore.getState().clear()
        vi.restoreAllMocks()
        mockNavigate.mockClear()
    })

    it('las llamadas normales no envían credenciales', async () => {
        const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
            data: { data: 1 },
            status: 200,
            statusText: '',
            headers: {},
            config,
        }))

        await httpClient.get('/x', { adapter })

        // faclab-invoicing no acepta credenciales por CORS
        expect(adapter.mock.calls[0][0].withCredentials).toBeFalsy()
    })

    it('adjunta el access token del store', async () => {
        const { adapter, authHeaders } = makeAdapter({
            status: 200,
            data: { data: 1 },
        })

        const body = await httpClient.get('/x', { adapter })

        expect(body).toEqual({ data: 1 })
        expect(authHeaders).toEqual(['Bearer old-at'])
    })

    it('TOKEN_EXPIRED: renueva, guarda en el store y reintenta una vez', async () => {
        const post = vi
            .spyOn(axios, 'post')
            .mockResolvedValue({ data: { data: newTokens } })
        const { adapter, authHeaders } = makeAdapter(
            { status: 401, data: errorBody('TOKEN_EXPIRED') },
            { status: 200, data: { data: 'ok' } }
        )

        const body = await httpClient.get('/x', { adapter })

        expect(body).toEqual({ data: 'ok' })
        expect(post).toHaveBeenCalledTimes(1)
        // El refresh token va en la cookie HttpOnly: sin cuerpo, con credenciales
        const [url, refreshBody, config] = post.mock.calls[0]
        expect(url).toMatch(/\/api\/auth\/refresh$/)
        expect(refreshBody).toBeUndefined()
        expect(config).toMatchObject({ withCredentials: true })
        expect(authHeaders).toEqual(['Bearer old-at', 'Bearer new-at'])
        expect(useAuthStore.getState().accessToken).toBe('new-at')
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('TOKEN_EXPIRED concurrentes comparten un solo refresh', async () => {
        let resolveRefresh!: (value: unknown) => void
        const post = vi.spyOn(axios, 'post').mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRefresh = resolve
                })
        )
        const a = makeAdapter(
            { status: 401, data: errorBody('TOKEN_EXPIRED') },
            { status: 200, data: 'a' }
        )
        const b = makeAdapter(
            { status: 401, data: errorBody('TOKEN_EXPIRED') },
            { status: 200, data: 'b' }
        )

        const pending = Promise.all([
            httpClient.get('/a', { adapter: a.adapter }),
            httpClient.get('/b', { adapter: b.adapter }),
        ])
        await vi.waitFor(() => expect(post).toHaveBeenCalled())
        resolveRefresh({ data: { data: newTokens } })

        await expect(pending).resolves.toEqual(['a', 'b'])
        expect(post).toHaveBeenCalledTimes(1)
        expect(a.authHeaders[1]).toBe('Bearer new-at')
        expect(b.authHeaders[1]).toBe('Bearer new-at')
    })

    it('si el refresh falla, cierra sesión y limpia el store', async () => {
        vi.spyOn(axios, 'post').mockRejectedValue(
            new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST)
        )
        const { adapter } = makeAdapter({
            status: 401,
            data: errorBody('TOKEN_EXPIRED'),
        })

        const err = await httpClient.get('/x', { adapter }).catch((e) => e)

        expect(isApiError(err) && err.code).toBe('TOKEN_EXPIRED')
        expect(useAuthStore.getState().accessToken).toBeNull()
        expect(useAuthStore.getState().session).toBeNull()
        expect(localStorage.getItem('fc.hasSession')).toBeNull()
        expect(mockNavigate).toHaveBeenCalledWith('/sign-in', {
            replace: true,
        })
    })

    it('si el reintento vuelve a dar TOKEN_EXPIRED, cierra sesión sin otro refresh', async () => {
        const post = vi
            .spyOn(axios, 'post')
            .mockResolvedValue({ data: { data: newTokens } })
        const { adapter } = makeAdapter(
            { status: 401, data: errorBody('TOKEN_EXPIRED') },
            { status: 401, data: errorBody('TOKEN_EXPIRED') }
        )

        await expect(httpClient.get('/x', { adapter })).rejects.toThrow()

        expect(post).toHaveBeenCalledTimes(1)
        expect(useAuthStore.getState().accessToken).toBeNull()
        expect(mockNavigate).toHaveBeenCalledWith('/sign-in', {
            replace: true,
        })
    })

    it('INVALID_TOKEN cierra sesión', async () => {
        const { adapter } = makeAdapter({
            status: 401,
            data: errorBody('INVALID_TOKEN'),
        })

        await expect(httpClient.get('/x', { adapter })).rejects.toThrow()

        expect(useAuthStore.getState().accessToken).toBeNull()
        expect(mockNavigate).toHaveBeenCalledWith('/sign-in', {
            replace: true,
        })
    })

    it('PASSWORD_CHANGE_REQUIRED redirige a /change-password sin cerrar sesión', async () => {
        const { adapter } = makeAdapter({
            status: 403,
            data: errorBody('PASSWORD_CHANGE_REQUIRED'),
        })

        await expect(httpClient.get('/x', { adapter })).rejects.toThrow()

        expect(mockNavigate).toHaveBeenCalledWith('/change-password', {
            replace: true,
        })
        expect(useAuthStore.getState().accessToken).toBe('old-at')
    })

    it('PERMISSION_DENIED con sesión activa solo rechaza', async () => {
        const { adapter } = makeAdapter({
            status: 403,
            data: errorBody('PERMISSION_DENIED'),
        })

        await expect(httpClient.get('/x', { adapter })).rejects.toThrow()

        expect(mockNavigate).not.toHaveBeenCalled()
        expect(useAuthStore.getState().accessToken).toBe('old-at')
    })

    it('otros errores se rechazan como ApiError sin tocar la sesión', async () => {
        const { adapter } = makeAdapter({
            status: 400,
            data: errorBody('INVALID_CREDENTIALS', 'Credenciales inválidas'),
        })

        const err = await httpClient
            .post<never>('/login', { username: 'a' }, { adapter })
            .catch((e: ApiError) => e)

        expect(isApiError(err)).toBe(true)
        expect(err.code).toBe('INVALID_CREDENTIALS')
        expect(err.message).toBe('Credenciales inválidas')
        expect(err.status).toBe(400)
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(useAuthStore.getState().accessToken).toBe('old-at')
    })
})
