import { create } from 'zustand'

/**
 * La sesión del operador de la plataforma (S8.5). Solo vive en memoria: el
 * token dura minutos, no tiene refresh y al recargar se vuelve a ingresar. No
 * toca `useAuthStore`: el operador no tiene empresa.
 */
interface PlatformState {
    accessToken: string | null
    expiresAt: number | null
    operatorName: string | null

    signIn: (payload: {
        accessToken: string
        expiresIn: number
        displayName: string
    }) => void
    clear: () => void
}

export const usePlatformStore = create<PlatformState>((set) => ({
    accessToken: null,
    expiresAt: null,
    operatorName: null,

    signIn: ({ accessToken, expiresIn, displayName }) =>
        set({
            accessToken,
            expiresAt: Date.now() + expiresIn * 1000,
            operatorName: displayName,
        }),

    clear: () =>
        set({ accessToken: null, expiresAt: null, operatorName: null }),
}))

/** Hay token y no venció */
export const usePlatformSignedIn = (): boolean =>
    usePlatformStore(
        (state) =>
            state.accessToken !== null &&
            (state.expiresAt === null || state.expiresAt > Date.now())
    )
