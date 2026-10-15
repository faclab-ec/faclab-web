/**
 * Avisos de sesión entre pestañas del mismo origen.
 *
 * - `tokens`: otra pestaña renovó o abrió la sesión; esta adopta el access
 *   token en vez de pedir su propio refresh.
 * - `logout`: la sesión terminó en otra pestaña; esta también la cierra.
 *
 * Una pestaña no recibe sus propios mensajes. Sin `BroadcastChannel` (navegador
 * viejo, algunos entornos de prueba) los avisos simplemente no llegan.
 */
export type AuthMessage =
    | { type: 'tokens'; accessToken: string; expiresIn: number }
    | { type: 'logout' }

const CHANNEL_NAME = 'faclab-auth'

let channel: BroadcastChannel | null | undefined

const getChannel = (): BroadcastChannel | null => {
    if (channel === undefined) {
        channel =
            typeof BroadcastChannel === 'undefined'
                ? null
                : new BroadcastChannel(CHANNEL_NAME)
    }
    return channel
}

export const authChannel = {
    post(message: AuthMessage): void {
        try {
            getChannel()?.postMessage(message)
        } catch {
            /* ignore */
        }
    },

    subscribe(listener: (message: AuthMessage) => void): () => void {
        const ch = getChannel()
        if (!ch) return () => {}
        const handler = (event: MessageEvent<AuthMessage>) =>
            listener(event.data)
        ch.addEventListener('message', handler)
        return () => ch.removeEventListener('message', handler)
    },

    /** Solo para pruebas: cierra el canal y permite crear uno nuevo. */
    _reset(): void {
        channel?.close()
        channel = undefined
    },
}

export const AUTH_CHANNEL_NAME = CHANNEL_NAME
