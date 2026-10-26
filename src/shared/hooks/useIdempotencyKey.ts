import { useRef } from 'react'
import { isApiError } from '@/utils/errors/ApiError'
import { newIdempotencyKey } from '@shared/lib/http/idempotency'

/**
 * Clave de idempotencia de una operación del usuario (cobrar, devolver, mover
 * caja). Es la misma en cada intento, también cuando el usuario vuelve a pulsar
 * después de un fallo de red, hasta que la operación sale bien: si el primer
 * intento sí llegó al core, el siguiente recibe su respuesta en vez de
 * duplicarlo.
 */
export function useIdempotencyKey() {
    const key = useRef<string | null>(null)

    const reset = () => {
        key.current = null
    }

    return {
        /** La clave de la operación en curso (se crea en el primer intento) */
        current: (): string => (key.current ??= newIdempotencyKey()),
        /** La operación terminó bien: la próxima lleva otra clave */
        reset,
        /**
         * Tras un error. `IDEMPOTENCY_KEY_REUSED` dice que un intento anterior
         * con esta clave sí se registró y este trae otros datos: la próxima
         * operación lleva otra clave. Con cualquier otro error se conserva.
         */
        resetIfUsed: (error: unknown) => {
            if (isApiError(error) && error.code === 'IDEMPOTENCY_KEY_REUSED') {
                reset()
            }
        },
    }
}
