import appConfig from '@/configs/app.config'
import type { RefreshResponse } from '@/@types/auth'
import { useAuthStore } from '@/stores/useAuthStore'
import { queryClient } from '@shared/lib/react-query'
import { navigateTo } from './navigationRef'
import { refreshOnce } from './refreshManager'

/**
 * Renueva el par de tokens y lo guarda en `useAuthStore` (que a su vez
 * persiste en `tokenStorage`). Toda escritura de tokens pasa por el store
 * para que `httpClient` y la UI nunca lean un token desactualizado.
 */
export const refreshSession = async (): Promise<RefreshResponse> => {
    const tokens = await refreshOnce(useAuthStore.getState().refreshToken)
    useAuthStore.getState().setTokens(tokens)
    return tokens
}

/**
 * Cierra la sesión localmente: limpia store + tokenStorage, descarta la caché
 * de React Query y manda al login.
 */
export const forceSignOut = (): void => {
    useAuthStore.getState().clear()
    queryClient.clear()
    navigateTo(appConfig.unAuthenticatedEntryPath, { replace: true })
}
