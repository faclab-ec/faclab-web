import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import appConfig from '@/configs/app.config'
import type { DataResponse } from '@/@types/api'
import { fromAxiosError } from '@/utils/errors/ApiError'
import { usePlatformStore } from '../store/usePlatformStore'
import type {
    ChangeSubscriptionInput,
    CreatedTenant,
    CreateTenantInput,
    PlatformLoginResult,
    PlatformPlan,
    TenantDetail,
    TenantList,
    TenantStatus,
} from '../model/types'

const PLATFORM = `${appConfig.apiBaseUrl}/api/platform`

/**
 * Cliente propio de la consola: su token no es el de una empresa, así que no
 * pasa por `httpClient` (que renueva y cierra la sesión de la empresa). Un
 * token vencido o revocado limpia solo la sesión de plataforma.
 */
const instance = axios.create({ timeout: 60000 })

instance.interceptors.request.use((config) => {
    const token = usePlatformStore.getState().accessToken
    if (token && !config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
})

instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const apiError = fromAxiosError(error)
        if (
            ['TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(apiError.code) &&
            usePlatformStore.getState().accessToken
        ) {
            usePlatformStore.getState().clear()
        }
        return Promise.reject(apiError)
    }
)

const request = async <T>(config: AxiosRequestConfig): Promise<T> =>
    (await instance.request<T>(config)).data

export const platformLogin = (username: string, password: string) =>
    request<DataResponse<PlatformLoginResult>>({
        method: 'POST',
        url: `${PLATFORM}/auth/login`,
        data: { username, password },
    })

export const listTenants = (params: {
    q?: string
    status?: TenantStatus
    limit?: number
    offset?: number
}) =>
    request<DataResponse<TenantList>>({
        method: 'GET',
        url: `${PLATFORM}/tenants`,
        params,
    })

export const getTenant = (id: string) =>
    request<DataResponse<TenantDetail>>({
        method: 'GET',
        url: `${PLATFORM}/tenants/${id}`,
    })

export const createTenant = (body: CreateTenantInput) =>
    request<DataResponse<CreatedTenant>>({
        method: 'POST',
        url: `${PLATFORM}/tenants`,
        data: body,
    })

export const suspendTenant = (id: string, reason?: string) =>
    request<DataResponse<{ status: TenantStatus; revokedSessions: number }>>({
        method: 'POST',
        url: `${PLATFORM}/tenants/${id}/suspend`,
        data: { reason },
    })

export const activateTenant = (id: string) =>
    request<DataResponse<{ status: TenantStatus }>>({
        method: 'POST',
        url: `${PLATFORM}/tenants/${id}/activate`,
        data: {},
    })

export const changeSubscription = (id: string, body: ChangeSubscriptionInput) =>
    request<DataResponse<unknown>>({
        method: 'PUT',
        url: `${PLATFORM}/tenants/${id}/subscription`,
        data: body,
    })

export const listPlans = () =>
    request<DataResponse<PlatformPlan[]>>({
        method: 'GET',
        url: `${PLATFORM}/plans`,
    })
