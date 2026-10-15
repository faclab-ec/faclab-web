import axios, { AxiosError } from 'axios'
import appConfig from '@/configs/app.config'
import type { ApiEnvelope, RefreshResponse } from '@/@types/auth'
import { fromAxiosError } from '@/utils/errors/ApiError'

/**
 * Llamada de red a /auth/refresh, deduplicada: las peticiones concurrentes
 * comparten la misma promesa para no rotar el refresh token dos veces.
 *
 * El refresh token viaja en la cookie HttpOnly `faclab_refresh`, así que la
 * petición no lleva cuerpo pero sí `withCredentials`. No guarda nada: quien
 * llama guarda el access token vía `useAuthStore` (ver `refreshSession` en
 * ./session.ts). Usa axios crudo para no pasar por los interceptores de
 * `httpClient`.
 */
let inFlight: Promise<RefreshResponse> | null = null

const doRefresh = async (): Promise<RefreshResponse> => {
    try {
        const response = await axios.post<ApiEnvelope<RefreshResponse>>(
            `${appConfig.authApiHost}/refresh`,
            undefined,
            { withCredentials: true }
        )
        return response.data.data
    } catch (err) {
        throw fromAxiosError(err as AxiosError)
    }
}

export const refreshOnce = (): Promise<RefreshResponse> => {
    if (inFlight) return inFlight
    inFlight = doRefresh().finally(() => {
        inFlight = null
    })
    return inFlight
}

export const resetRefreshManager = (): void => {
    inFlight = null
}
