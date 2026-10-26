import { isApiError } from '@/utils/errors/ApiError'
import {
    getErrorMessage,
    type ErrorMessages,
} from '@shared/lib/getErrorMessage'

/**
 * Respuestas del backend que dicen que la caja de este navegador ya no sirve
 * (desactivada, borrada, movida de sucursal, o la sucursal desactivada): hay
 * que elegir otra.
 */
const TERMINAL_UNAVAILABLE_CODES = new Set([
    'POS_TERMINAL_INACTIVE',
    'POS_TERMINAL_OUTSIDE_BRANCH',
    'BRANCH_INACTIVE',
    'TERMINAL_REQUIRED',
    'NOT_FOUND',
])

export const isTerminalUnavailable = (error: unknown): boolean =>
    isApiError(error) && TERMINAL_UNAVAILABLE_CODES.has(error.code)

// El backend responde en inglés: estos casos los ve el cajero
export const POS_ERROR_MESSAGES: ErrorMessages = {
    SHIFT_ALREADY_OPEN: 'Ya hay un turno abierto en esta caja.',
    POS_TERMINAL_INACTIVE: 'La caja está desactivada. Elige otra caja.',
    POS_TERMINAL_OUTSIDE_BRANCH: 'La caja no pertenece a la sucursal elegida.',
    BRANCH_INACTIVE: 'La sucursal está desactivada.',
    TERMINAL_REQUIRED: 'Elige la caja de este navegador.',
    BRANCH_REQUIRED: 'Elige la sucursal.',
    REFUND_OUTSIDE_BRANCH:
        'La venta es de otra sucursal: la devolución se hace en esa sucursal.',
    // Un intento anterior de esta operación sí se registró (la red falló
    // antes de la respuesta) y este trae otros datos
    IDEMPOTENCY_KEY_REUSED:
        'La operación anterior sí se registró. Revisa las ventas y movimientos del turno antes de repetirla.',
    IDEMPOTENCY_IN_PROGRESS:
        'La operación anterior todavía se está procesando. Espera unos segundos y vuelve a intentar.',
}

export const posErrorMessage = (error: unknown, fallback: string): string =>
    getErrorMessage(error, fallback, POS_ERROR_MESSAGES)
