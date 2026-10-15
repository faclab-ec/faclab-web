import appConfig from '@/configs/app.config'
import type { RefreshResponse } from '@/@types/auth'
import { useAuthStore } from '@/stores/useAuthStore'
import { queryClient } from '@shared/lib/react-query'
import { authChannel } from './authChannel'
import { navigateTo } from './navigationRef'
import { refreshOnce } from './refreshManager'

/**
 * Pide un access token nuevo con la cookie de refresh, lo guarda en
 * `useAuthStore` y lo comparte con las otras pestañas. Toda escritura de
 * tokens pasa por el store para que `httpClient` y la UI nunca lean un token
 * desactualizado.
 */
export const refreshSession = async (): Promise<RefreshResponse> => {
    const tokens = await refreshOnce()
    useAuthStore.getState().setTokens(tokens)
    authChannel.post({
        type: 'tokens',
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
    })
    return tokens
}

/**
 * Cierra la sesión localmente y en las otras pestañas: limpia el store,
 * descarta la caché de React Query y manda al login.
 */
export const forceSignOut = (): void => {
    useAuthStore.getState().clear()
    queryClient.clear()
    authChannel.post({ type: 'logout' })
    navigateTo(appConfig.unAuthenticatedEntryPath, { replace: true })
}
