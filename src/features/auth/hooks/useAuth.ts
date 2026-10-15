import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { apiChangePassword, apiLogin, apiLogout, apiMe } from '../api/client'
import { navigateTo } from '@shared/lib/auth/navigationRef'
import appConfig from '@/configs/app.config'
import { refreshSession } from '@shared/lib/auth/session'
import { authChannel } from '@shared/lib/auth/authChannel'
import sessionHint from '@shared/lib/auth/sessionHint'
import { queryClient } from '@shared/lib/react-query'
import { refreshScheduler } from '../lib/refreshScheduler'
import type {
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
} from '@/@types/auth'

export const ME_QUERY_KEY = ['auth', 'me'] as const

export function useMe() {
    const accessToken = useAuthStore((s) => s.accessToken)
    const setSession = useAuthStore((s) => s.setSession)
    const clear = useAuthStore((s) => s.clear)

    return useQuery<MeResponse>({
        queryKey: ME_QUERY_KEY,
        queryFn: async () => {
            try {
                const expiresAt = useAuthStore.getState().accessExpiresAt
                if (expiresAt && expiresAt < Date.now()) {
                    const newTokens = await refreshSession()
                    refreshScheduler.start(newTokens.expiresIn)
                }
                const { data: session } = await apiMe()
                setSession(session)
                return session
            } catch (err) {
                clear()
                throw err
            }
        },
        enabled: !!accessToken,
        staleTime: 5 * 60 * 1000,
        retry: false,
    })
}

/**
 * Al abrir la app el access token no existe (vive en memoria). Si hay una
 * sesión abierta en este navegador, lo recupera con la cookie de refresh;
 * mientras tanto `restoring` es true.
 */
export function useRestoreSession(): boolean {
    const [restoring, setRestoring] = useState(
        () => !useAuthStore.getState().accessToken && sessionHint.has()
    )

    useEffect(() => {
        sessionHint.purgeLegacyTokens()
        if (!restoring) return
        refreshSession()
            .then((tokens) => refreshScheduler.start(tokens.expiresIn))
            .catch(() => useAuthStore.getState().clear())
            .finally(() => setRestoring(false))
        // Solo al montar: refreshOnce deduplica el doble montaje de StrictMode
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return restoring
}

/** Adopta los tokens y los cierres de sesión que llegan de otras pestañas. */
export function useAuthChannelSync(): void {
    useEffect(
        () =>
            authChannel.subscribe((message) => {
                if (message.type === 'tokens') {
                    useAuthStore.getState().setTokens(message)
                    refreshScheduler.start(message.expiresIn)
                    return
                }
                if (!useAuthStore.getState().accessToken) return
                refreshScheduler.stop()
                useAuthStore.getState().clear()
                queryClient.clear()
                navigateTo(appConfig.unAuthenticatedEntryPath, {
                    replace: true,
                })
            }),
        []
    )
}

export function useLogin() {
    const qc = useQueryClient()
    const setTokens = useAuthStore((s) => s.setTokens)
    const setSession = useAuthStore((s) => s.setSession)

    return useMutation<LoginResponse, unknown, LoginRequest>({
        mutationFn: async (body) => (await apiLogin(body)).data,
        onSuccess: async (tokens) => {
            setTokens(tokens)
            authChannel.post({
                type: 'tokens',
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn,
            })
            refreshScheduler.start(tokens.expiresIn)
            const session = await qc.fetchQuery({
                queryKey: ME_QUERY_KEY,
                queryFn: async () => (await apiMe()).data,
            })
            setSession(session)
        },
    })
}

export function useChangePassword() {
    const qc = useQueryClient()
    const setSession = useAuthStore((s) => s.setSession)

    return useMutation<void, unknown, ChangePasswordRequest>({
        mutationFn: (body) => apiChangePassword(body),
        onSuccess: async () => {
            // Los tokens vigentes aún dicen "debe cambiar la contraseña"
            const newTokens = await refreshSession()
            refreshScheduler.start(newTokens.expiresIn)
            const session = await qc.fetchQuery({
                queryKey: ME_QUERY_KEY,
                queryFn: async () => (await apiMe()).data,
            })
            setSession(session)
        },
    })
}

export function useLogout() {
    const qc = useQueryClient()
    const clear = useAuthStore((s) => s.clear)

    return useMutation<void, unknown, void>({
        mutationFn: async () => {
            try {
                await apiLogout()
            } catch {
                /* Sin red o con la sesión ya cerrada, la sesión local se cierra igual */
            }
        },
        onSuccess: () => {
            refreshScheduler.stop()
            clear()
            authChannel.post({ type: 'logout' })
            qc.clear()
            navigateTo(appConfig.unAuthenticatedEntryPath, { replace: true })
        },
    })
}
