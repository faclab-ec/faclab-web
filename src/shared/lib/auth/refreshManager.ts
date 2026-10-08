import axios, { AxiosError } from 'axios'
import appConfig from '@/configs/app.config'
import type { ApiEnvelope, RefreshResponse } from '@/@types/auth'
import { ApiError, fromAxiosError } from '@/utils/errors/ApiError'

/**
 * Llamada de red a /auth/refresh, deduplicada: las peticiones concurrentes
 * comparten la misma promesa para no rotar el refresh token dos veces.
 *
 * No persiste nada. Quien llama guarda los tokens vía `useAuthStore`
 * (ver `refreshSession` en ./session.ts). Usa axios crudo para no pasar por
 * los interceptores de `httpClient`.
 */
let inFlight: Promise<RefreshResponse> | null = null

const doRefresh = async (
    refreshToken: string | null
): Promise<RefreshResponse> => {
    if (!refreshToken) {
        throw new ApiError({
            code: 'INVALID_TOKEN',
            message: 'Missing refresh token',
            status: 0,
        })
    }

    try {
        const response = await axios.post<ApiEnvelope<RefreshResponse>>(
            `${appConfig.authApiHost}/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
        )
        return response.data.data
    } catch (err) {
        throw fromAxiosError(err as AxiosError)
    }
}

export const refreshOnce = (
    refreshToken: string | null
): Promise<RefreshResponse> => {
    if (inFlight) return inFlight
    inFlight = doRefresh(refreshToken).finally(() => {
        inFlight = null
    })
    return inFlight
}

export const resetRefreshManager = (): void => {
    inFlight = null
}
