import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError } from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { httpClient } from '../httpClient'
import appConfig from '@/configs/app.config'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkplaceStore } from '@/stores/useWorkplaceStore'
import { ROLE } from '@/constants/roles.constant'
import type { Session } from '@/@types/auth'
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

    it('TOKEN_EXPIRED sin sesión en memoria solo rechaza, sin renovar', async () => {
        // P. ej. venció el token de selección de empresa: la cookie de
        // refresh podría ser de otra sesión
        useAuthStore.getState().clear()
        const post = vi.spyOn(axios, 'post')
        const { adapter, authHeaders } = makeAdapter({
            status: 401,
            data: errorBody('TOKEN_EXPIRED'),
        })

        const err = await httpClient
            .post(
                '/select-tenant',
                {},
                {
                    adapter,
                    headers: { Authorization: 'Bearer selection' },
                }
            )
            .catch((e: ApiError) => e)

        expect(isApiError(err) && err.code).toBe('TOKEN_EXPIRED')
        expect(authHeaders).toEqual(['Bearer selection'])
        expect(post).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('un token explícito en la llamada gana al del store', async () => {
        const { adapter, authHeaders } = makeAdapter({ status: 200, data: {} })

        await httpClient.get('/me', {
            adapter,
            headers: { Authorization: 'Bearer de-la-otra-empresa' },
        })

        expect(authHeaders).toEqual(['Bearer de-la-otra-empresa'])
    })

    it('BRANCH_ACCESS_DENIED: renueva (sucursales nuevas) y reintenta una vez', async () => {
        const post = vi
            .spyOn(axios, 'post')
            .mockResolvedValue({ data: { data: newTokens } })
        const { adapter, authHeaders } = makeAdapter(
            { status: 403, data: errorBody('BRANCH_ACCESS_DENIED') },
            { status: 200, data: { data: 'ok' } }
        )

        const body = await httpClient.get('/x', { adapter })

        expect(body).toEqual({ data: 'ok' })
        expect(post).toHaveBeenCalledTimes(1)
        expect(authHeaders).toEqual(['Bearer old-at', 'Bearer new-at'])
    })

    it('BRANCH_ACCESS_DENIED tras el reintento se rechaza sin cerrar sesión', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({ data: { data: newTokens } })
        const { adapter } = makeAdapter(
            { status: 403, data: errorBody('BRANCH_ACCESS_DENIED') },
            { status: 403, data: errorBody('BRANCH_ACCESS_DENIED') }
        )

        const err = await httpClient
            .get('/x', { adapter })
            .catch((e: ApiError) => e)

        expect(isApiError(err) && err.code).toBe('BRANCH_ACCESS_DENIED')
        expect(useAuthStore.getState().accessToken).toBe('new-at')
        expect(mockNavigate).not.toHaveBeenCalled()
    })
})

describe('httpClient: sucursal y caja', () => {
    const session: Session = {
        id: 1,
        username: 'caja1',
        fullName: null,
        role: ROLE.CASHIER,
        permissions: [],
        mustChangePassword: false,
        tenant: {
            id: 'tenant-a',
            ruc: '0190000000001',
            legalName: 'A',
            tradeName: null,
        },
        tenants: [],
        branches: [
            { id: 3, establishmentCode: '003', name: 'Sur', isMain: true },
        ],
    }

    /** Encabezados de sucursal y caja que salieron en cada llamada */
    const placementOf = async (url: string) => {
        const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
            data: {},
            status: 200,
            statusText: '',
            headers: {},
            config,
        }))
        await httpClient.get(url, { adapter })
        const { headers } = adapter.mock.calls[0][0]
        return {
            branch: headers.get('X-Branch-Id') ?? null,
            terminal: headers.get('X-Terminal-Id') ?? null,
        }
    }

    beforeEach(() => {
        useAuthStore
            .getState()
            .signIn({ accessToken: 'at', expiresIn: 900 }, session)
        useWorkplaceStore.setState({
            branchByTenant: {},
            terminalByBranch: { 'tenant-a:3': 31 },
        })
    })

    afterEach(() => {
        useAuthStore.getState().clear()
    })

    it('la administración lleva la sucursal, sin caja', async () => {
        expect(
            await placementOf(`${appConfig.inventoryApiHost}/products?limit=5`)
        ).toEqual({ branch: '3', terminal: null })
        expect(
            await placementOf(`${appConfig.adminUsersApiHost}/7/branches`)
        ).toEqual({ branch: '3', terminal: null })
    })

    it('el POS lleva la sucursal y la caja vinculada', async () => {
        expect(
            await placementOf(`${appConfig.posApiHost}/shifts/active`)
        ).toEqual({ branch: '3', terminal: '31' })
    })

    it('auth y facturación no llevan ninguna', async () => {
        expect(await placementOf(`${appConfig.authApiHost}/me`)).toEqual({
            branch: null,
            terminal: null,
        })
        expect(
            await placementOf(`${appConfig.invoicingApiHost}/api/invoices`)
        ).toEqual({ branch: null, terminal: null })
    })

    it('sin caja vinculada el POS solo lleva la sucursal', async () => {
        useWorkplaceStore.setState({ terminalByBranch: {} })

        expect(await placementOf(`${appConfig.posApiHost}/terminals`)).toEqual({
            branch: '3',
            terminal: null,
        })
    })
})

describe('httpClient: operaciones idempotentes', () => {
    const KEY = '6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b'
    const withKey = { headers: { 'Idempotency-Key': KEY } }

    /**
     * Adapter que falla con `failures` (un timeout sin respuesta o una
     * respuesta de error) y después responde 201. Guarda la clave de cada
     * intento.
     */
    const flaky = (...failures: ('timeout' | Reply)[]) => {
        const keys: (string | undefined)[] = []
        const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
            keys.push(config.headers.get('Idempotency-Key') as string)
            const failure = failures.shift()
            if (failure === 'timeout') {
                throw new AxiosError(
                    'timeout of 60000ms exceeded',
                    AxiosError.ECONNABORTED,
                    config
                )
            }
            const reply = failure ?? { status: 201, data: { data: 'venta' } }
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
        return { adapter, keys }
    }

    beforeEach(() => {
        vi.useFakeTimers()
        useAuthStore.getState().setTokens({ accessToken: 'at', expiresIn: 900 })
    })

    afterEach(() => {
        vi.useRealTimers()
        useAuthStore.getState().clear()
    })

    const settle = async <T>(promise: Promise<T>) => {
        const outcome = promise.then(
            (value) => ({ value }),
            (error: unknown) => ({ error })
        )
        await vi.runAllTimersAsync()
        return outcome
    }

    it('reintenta tras un timeout con la misma clave', async () => {
        const { adapter, keys } = flaky('timeout')

        const outcome = await settle(
            httpClient.post('/sales/quick', {}, { ...withKey, adapter })
        )

        expect(outcome).toEqual({ value: { data: 'venta' } })
        expect(keys).toEqual([KEY, KEY])
    })

    it('reintenta mientras otra solicitud con la clave sigue en curso', async () => {
        const { adapter, keys } = flaky({
            status: 409,
            data: errorBody('IDEMPOTENCY_IN_PROGRESS'),
        })

        const outcome = await settle(
            httpClient.post('/sales/quick', {}, { ...withKey, adapter })
        )

        expect(outcome).toEqual({ value: { data: 'venta' } })
        expect(keys).toEqual([KEY, KEY])
    })

    it('reintenta si el proxy no llegó al core', async () => {
        const { adapter, keys } = flaky({ status: 502 }, { status: 503 })

        const outcome = await settle(
            httpClient.post('/sales/quick', {}, { ...withKey, adapter })
        )

        expect(outcome).toEqual({ value: { data: 'venta' } })
        expect(keys).toEqual([KEY, KEY, KEY])
    })

    it('se rinde después de los reintentos', async () => {
        const { adapter, keys } = flaky('timeout', 'timeout', 'timeout')

        const outcome = await settle(
            httpClient.post('/sales/quick', {}, { ...withKey, adapter })
        )

        expect(keys).toEqual([KEY, KEY, KEY])
        const { error } = outcome as { error: ApiError }
        expect(isApiError(error) && error.code).toBe('ECONNABORTED')
    })

    it('no reintenta un error definitivo', async () => {
        const { adapter, keys } = flaky({
            status: 422,
            data: errorBody('IDEMPOTENCY_KEY_REUSED'),
        })

        const outcome = await settle(
            httpClient.post('/sales/quick', {}, { ...withKey, adapter })
        )

        expect(keys).toEqual([KEY])
        const { error } = outcome as { error: ApiError }
        expect(error.code).toBe('IDEMPOTENCY_KEY_REUSED')
    })

    it('no reintenta una solicitud sin clave', async () => {
        const { adapter, keys } = flaky('timeout')

        const outcome = await settle(
            httpClient.post('/shifts/open', {}, { adapter })
        )

        expect(keys).toEqual([undefined])
        expect('error' in outcome).toBe(true)
    })
})
