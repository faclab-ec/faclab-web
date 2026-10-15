import { create } from 'zustand'
import type { Session } from '@/@types/auth'
import type { Permission } from '@/constants/permissions.constant'
import type { RoleCode } from '@/constants/roles.constant'
import sessionHint from '@shared/lib/auth/sessionHint'
import { resetRefreshManager } from '@shared/lib/auth/refreshManager'

type SetTokensPayload = {
    accessToken: string
    expiresIn: number
}

/**
 * El access token solo vive en memoria: se pierde al recargar y se recupera
 * con la cookie de refresh (ver `useRestoreSession`). El refresh token nunca
 * llega a JavaScript.
 */
interface AuthState {
    accessToken: string | null
    accessExpiresAt: number | null
    session: Session | null

    setTokens: (payload: SetTokensPayload) => void
    setSession: (session: Session | null) => void
    clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    accessExpiresAt: null,
    session: null,

    setTokens: ({ accessToken, expiresIn }) => {
        sessionHint.mark()
        set({
            accessToken,
            accessExpiresAt: Date.now() + expiresIn * 1000,
        })
    },

    setSession: (session) => set({ session }),

    clear: () => {
        sessionHint.clear()
        resetRefreshManager()
        set({
            accessToken: null,
            accessExpiresAt: null,
            session: null,
        })
    },
}))

export const useAccessToken = (): string | null =>
    useAuthStore((s) => s.accessToken)

export const useSession = (): Session | null => useAuthStore((s) => s.session)

export const useIsAuthenticated = (): boolean =>
    useAuthStore((s) => !!s.accessToken && !!s.session)

export const useCan = (permission: Permission): boolean =>
    useAuthStore((s) => s.session?.permissions.includes(permission) ?? false)

export const useHasRole = (...roles: RoleCode[]): boolean =>
    useAuthStore((s) => (s.session ? roles.includes(s.session.role) : false))
