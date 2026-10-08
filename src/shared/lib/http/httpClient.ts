import axios from 'axios'
import type {
    AxiosError,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
} from 'axios'
import appConfig from '@/configs/app.config'
import { TOKEN_TYPE, REQUEST_HEADER_AUTH_KEY } from '@/constants/api.constant'
import { useAuthStore } from '@/stores/useAuthStore'
import { fromAxiosError } from '@/utils/errors/ApiError'
import { navigateTo } from '@shared/lib/auth/navigationRef'
import { forceSignOut, refreshSession } from '@shared/lib/auth/session'

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

const CHANGE_PASSWORD_PATH = '/change-password'

const instance = axios.create({
    timeout: 60000,
    baseURL: appConfig.apiPrefix,
})

instance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
            config.headers.set(REQUEST_HEADER_AUTH_KEY, `${TOKEN_TYPE}${token}`)
        }
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
