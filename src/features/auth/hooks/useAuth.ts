import { useEffect, useState } from 'react'
import {
    useMutation,
    useQuery,
    useQueryClient,
    type QueryClient,
} from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import {
    apiChangePassword,
    apiLogin,
    apiLogout,
    apiMe,
    apiSelectTenant,
} from '../api/client'
import { navigateTo } from '@shared/lib/auth/navigationRef'
import appConfig from '@/configs/app.config'
import { forceSignOut, refreshSession } from '@shared/lib/auth/session'
import { authChannel } from '@shared/lib/auth/authChannel'
import sessionHint from '@shared/lib/auth/sessionHint'
import { queryClient } from '@shared/lib/react-query'
import { refreshScheduler } from '../lib/refreshScheduler'
import { entryPathFor } from '../lib/entryPath'
import type {
    ChangePasswordRequest,
    LoginRequest,
    MeResponse,
    Session,
    TenantOption,
} from '@/@types/auth'

export const ME_QUERY_KEY = ['auth', 'me'] as const

type Tokens = { accessToken: string; expiresIn: number }

/**
 * Abre la sesión con los tokens de una empresa: lee `/me` con el token nuevo,
 * guarda tokens y sesión de una vez, avisa a las otras pestañas y programa la
 * renovación. `tenant` les avisa que cambió la empresa (descartan lo cargado).
 */
async function adoptTokens(
    qc: QueryClient,
    tokens: Tokens,
    notify: 'tokens' | 'tenant' | null
): Promise<Session> {
    const session = await qc.fetchQuery({
        queryKey: ME_QUERY_KEY,
        queryFn: async () => (await apiMe(tokens.accessToken)).data,
    })
    useAuthStore.getState().signIn(tokens, session)
    if (notify) {
        authChannel.post({
            type: notify,
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
        })
    }
    refreshScheduler.start(tokens.expiresIn)
    return session
}

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
                if (message.type === 'tenant') {
                    // Nada de lo cargado es de la empresa nueva
                    queryClient.clear()
                    adoptTokens(queryClient, message, null)
                        .then((session) =>
                            navigateTo(entryPathFor(session), { replace: true })
                        )
                        .catch(() => useAuthStore.getState().clear())
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

/**
 * Con una sola empresa el login abre la sesión; con varias devuelve el token
 * de selección (solo en memoria, dura pocos minutos) y la lista para elegir.
 */
export type LoginResult =
    | { status: 'signed-in'; session: Session }
    | {
          status: 'select-tenant'
          selectionToken: string
          tenants: TenantOption[]
      }

export function useLogin() {
    const qc = useQueryClient()

    return useMutation<LoginResult, unknown, LoginRequest>({
        mutationFn: async (body) => {
            const { data } = await apiLogin(body)
            if ('selectionToken' in data) {
                return {
                    status: 'select-tenant',
                    selectionToken: data.selectionToken,
                    tenants: data.tenants,
                }
            }
            const session = await adoptTokens(qc, data, 'tokens')
            return { status: 'signed-in', session }
        },
    })
}

/** Segundo paso del login: abre la sesión en la empresa elegida. */
export function useSelectTenant() {
    const qc = useQueryClient()

    return useMutation<
        Session,
        unknown,
        { tenantId: string; selectionToken: string }
    >({
        mutationFn: async ({ tenantId, selectionToken }) => {
            const { data } = await apiSelectTenant({ tenantId }, selectionToken)
            return adoptTokens(qc, data, 'tokens')
        },
    })
}

/**
 * Cambia de empresa sin cerrar sesión: el backend cierra la sesión actual y
 * abre otra. Descarta la caché (ninguna clave incluye la empresa) y lleva a la
 * pantalla de inicio de la empresa nueva, también en las otras pestañas.
 */
export function useSwitchTenant() {
    const qc = useQueryClient()

    return useMutation<Session, unknown, string>({
        mutationFn: async (tenantId) => {
            const { data } = await apiSelectTenant({ tenantId })
            qc.clear()
            try {
                return await adoptTokens(qc, data, 'tenant')
            } catch (err) {
                // La sesión anterior ya está cerrada en el servidor
                forceSignOut()
                throw err
            }
        },
        onSuccess: (session) =>
            navigateTo(entryPathFor(session), { replace: true }),
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
