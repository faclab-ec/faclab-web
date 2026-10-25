import axios from 'axios'
import type {
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
} from 'axios'
import appConfig from '@/configs/app.config'
import {
    BRANCH_HEADER,
    REQUEST_HEADER_AUTH_KEY,
    TERMINAL_HEADER,
    TOKEN_TYPE,
} from '@/constants/api.constant'
import { useAuthStore } from '@/stores/useAuthStore'
import { currentPlacement } from '@/stores/useWorkplaceStore'
import { fromAxiosError } from '@/utils/errors/ApiError'
import { navigateTo } from '@shared/lib/auth/navigationRef'
import { forceSignOut, refreshSession } from '@shared/lib/auth/session'

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

const CHANGE_PASSWORD_PATH = '/change-password'

const isUnder = (url: string | undefined, host: string): boolean =>
    !!url &&
    (url === host || url.startsWith(`${host}/`) || url.startsWith(`${host}?`))

/**
 * Sucursal y caja de la operación, solo hacia la administración y el POS de
 * faclab-core: auth no los necesita (y `/me` rechazaría una sucursal vieja) y
 * faclab-invoicing filtra por la empresa del token. Una llamada puede traer
 * los suyos.
 */
const setPlacementHeaders = (config: InternalAxiosRequestConfig): void => {
    const toPos = isUnder(config.url, appConfig.posApiHost)
    if (!toPos && !isUnder(config.url, appConfig.inventoryApiHost)) return

    const { branchId, terminalId } = currentPlacement()
    if (branchId !== null && !config.headers.has(BRANCH_HEADER)) {
        config.headers.set(BRANCH_HEADER, String(branchId))
    }
    if (toPos && terminalId !== null && !config.headers.has(TERMINAL_HEADER)) {
        config.headers.set(TERMINAL_HEADER, String(terminalId))
    }
}

const instance = axios.create({
    timeout: 60000,
    baseURL: appConfig.apiPrefix,
})

instance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken
        // Una llamada puede traer su propio token (el de selección de empresa
        // o el de la empresa recién elegida): ese manda.
        if (token && !config.headers.has(REQUEST_HEADER_AUTH_KEY)) {
            config.headers.set(REQUEST_HEADER_AUTH_KEY, `${TOKEN_TYPE}${token}`)
        }
        setPlacementHeaders(config)
        return config
    },
    (error) => Promise.reject(error)
)

/**
 * Todos los errores salen como `ApiError`. Las decisiones de sesión se toman
 * por el `code` del envelope `{ errors, meta }`, no por el status HTTP
 * (p. ej. INVALID_CREDENTIALS es 400 y no debe cerrar sesión).
 */
instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const apiError = fromAxiosError(error)
        const originalConfig = error.config as RetriableConfig | undefined

        switch (apiError.code) {
            case 'TOKEN_EXPIRED': {
                // Sin sesión en memoria no hay nada que renovar: venció un
                // token de selección de empresa, y la cookie de refresh podría
                // ser de otra sesión.
                if (!useAuthStore.getState().accessToken) {
                    return Promise.reject(apiError)
                }
                if (!originalConfig || originalConfig._retried) {
                    forceSignOut()
                    return Promise.reject(apiError)
                }
                try {
                    const { accessToken } = await refreshSession()
                    originalConfig._retried = true
                    originalConfig.headers.set(
                        REQUEST_HEADER_AUTH_KEY,
                        `${TOKEN_TYPE}${accessToken}`
                    )
                    return instance.request(originalConfig)
                } catch {
                    forceSignOut()
                    return Promise.reject(apiError)
                }
            }
            case 'BRANCH_ACCESS_DENIED': {
                // Un cambio de accesos por sucursal rige desde el próximo
                // refresh: con el token nuevo (y sus `bids`) se reintenta una vez.
                if (
                    !originalConfig ||
                    originalConfig._retried ||
                    !useAuthStore.getState().accessToken
                ) {
                    return Promise.reject(apiError)
                }
                try {
                    const { accessToken } = await refreshSession()
                    originalConfig._retried = true
                    originalConfig.headers.set(
                        REQUEST_HEADER_AUTH_KEY,
                        `${TOKEN_TYPE}${accessToken}`
                    )
                    return instance.request(originalConfig)
                } catch {
                    forceSignOut()
                    return Promise.reject(apiError)
                }
            }
            case 'INVALID_TOKEN':
                forceSignOut()
                return Promise.reject(apiError)
            case 'PERMISSION_DENIED':
                if (!useAuthStore.getState().accessToken) {
                    forceSignOut()
                }
                return Promise.reject(apiError)
            case 'PASSWORD_CHANGE_REQUIRED':
                navigateTo(CHANGE_PASSWORD_PATH, { replace: true })
                return Promise.reject(apiError)
            default:
                return Promise.reject(apiError)
        }
    }
)

async function request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await instance.request<T>(config)
    return response.data
}

export const httpClient = {
    get<T>(
        url: string,
        config?: Omit<AxiosRequestConfig, 'url' | 'method'>
    ): Promise<T> {
        return request<T>({ ...config, url, method: 'GET' })
    },
    post<T>(
        url: string,
        data?: unknown,
        config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
    ): Promise<T> {
        return request<T>({ ...config, url, method: 'POST', data })
    },
    patch<T>(
        url: string,
        data?: unknown,
        config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
    ): Promise<T> {
        return request<T>({ ...config, url, method: 'PATCH', data })
    },
    put<T>(
        url: string,
        data?: unknown,
        config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
    ): Promise<T> {
        return request<T>({ ...config, url, method: 'PUT', data })
    },
    delete<T = void>(
        url: string,
        config?: Omit<AxiosRequestConfig, 'url' | 'method'>
    ): Promise<T> {
        return request<T>({ ...config, url, method: 'DELETE' })
    },
}
