/**
 * Marca no secreta de que hay una sesión abierta en este navegador.
 *
 * Los tokens no se guardan en el navegador: el access token vive en memoria
 * (`useAuthStore`) y el refresh token en una cookie HttpOnly que solo ve el
 * backend. Al recargar, la app solo llama a /auth/refresh si esta marca
 * existe, para no pedir un refresh (y recibir un 401) en cada visita anónima.
 */
const SESSION_KEY = 'fc.hasSession'

// Claves de versiones que guardaban los tokens en localStorage
const LEGACY_TOKEN_KEYS = ['fc.access', 'fc.refresh', 'fc.accessExpiresAt']

const storage = (): Storage | null => {
    try {
        return typeof window === 'undefined' ? null : window.localStorage
    } catch {
        return null
    }
}

const safe = (fn: (s: Storage) => void): void => {
    try {
        const s = storage()
        if (s) fn(s)
    } catch {
        /* ignore */
    }
}

export const sessionHint = {
    has(): boolean {
        try {
            return storage()?.getItem(SESSION_KEY) === '1'
        } catch {
            return false
        }
    },
    mark(): void {
        safe((s) => s.setItem(SESSION_KEY, '1'))
    },
    clear(): void {
        safe((s) => s.removeItem(SESSION_KEY))
    },
    purgeLegacyTokens(): void {
        safe((s) => LEGACY_TOKEN_KEYS.forEach((key) => s.removeItem(key)))
    },
}

export default sessionHint
