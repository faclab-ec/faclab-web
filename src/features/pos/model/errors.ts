import { isApiError } from '@/utils/errors/ApiError'
import { RECEIVABLE_ERROR_MESSAGES } from '@features/receivables'
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
    // Ventas a crédito, abonos y devoluciones de ventas a crédito (S5.5)
    ...RECEIVABLE_ERROR_MESSAGES,
    SHIFT_ALREADY_OPEN: 'Ya hay un turno abierto en esta caja.',
    // Cierre de caja con arqueo (S5.9)
    NO_OPEN_SHIFT:
        'El turno de esta operación ya está cerrado: abre un turno nuevo y repítela.',
    SHIFT_ALREADY_CLOSED: 'El turno ya está cerrado.',
    CLOSING_COUNT_MISSING:
        'Cuenta el efectivo y cada medio de pago que tuvo movimiento en el turno.',
    CLOSING_COUNT_INVALID:
        'El crédito no se cuenta al cerrar, y cada medio se cuenta una sola vez.',
    CLOSING_JUSTIFICATION_REQUIRED:
        'Una diferencia supera el umbral: escribe su justificación.',
    POS_TERMINAL_INACTIVE: 'La caja está desactivada. Elige otra caja.',
    POS_TERMINAL_OUTSIDE_BRANCH: 'La caja no pertenece a la sucursal elegida.',
    BRANCH_INACTIVE: 'La sucursal está desactivada.',
    TERMINAL_REQUIRED: 'Elige la caja de este navegador.',
    BRANCH_REQUIRED: 'Elige la sucursal.',
    CREDIT_NOTE_REQUIRED:
        'La venta está facturada: se anula con una devolución total, que genera la nota de crédito.',
    FINAL_CONSUMER_REFUND_NOT_ALLOWED:
        'La factura a consumidor final no se anula ni admite nota de crédito (Res. NAC-DGERCGC25-00000014): esta venta no se puede devolver.',
    REFUND_REASON_REQUIRED:
        'Escribe el motivo: va en la nota de crédito que recibe el comprador.',
    EXCEEDS_ORIGINAL_QUANTITY:
        'La cantidad supera lo que queda sin devolver de esa venta.',
    QUANTITY_PRECISION_EXCEEDED:
        'La cantidad tiene más decimales de los que admite la unidad del producto (por ejemplo, un producto por unidades no se vende en fracciones).',
    SALE_NOT_CONFIRMED: 'La venta no está confirmada o ya se anuló.',
    REFUND_OUTSIDE_BRANCH:
        'La venta es de otra sucursal: la devolución se hace en esa sucursal.',
    INSUFFICIENT_PAYMENT: 'Los pagos no cubren el total de la venta.',
    PAYMENT_EXCEEDS_BALANCE:
        'Solo el pago en efectivo puede superar lo que falta por cobrar.',
    SALE_NOT_PAYABLE: 'La venta está cancelada o facturada: no recibe pagos.',
    // El precio de lista cambió mientras se armaba el carrito (S5.3)
    OVERRIDE_REASON_REQUIRED:
        'El precio de un producto no es el de su lista: escribe el motivo del cambio o vuelve al precio de lista.',
    PRODUCT_WITHOUT_PRICE:
        'Un producto no tiene precio de venta ni precio en la lista: escríbelo en la línea.',
    // Cobrar una cotización (S5.4)
    QUOTE_EXPIRED: 'La cotización venció: renuévala antes de cobrarla.',
    QUOTE_ITEMS_CHANGED:
        'Los ítems no son los de la cotización: cóbrala con sus mismos ítems o quita la cotización.',
    QUOTE_CUSTOMER_CHANGED: 'La venta debe ser del cliente de la cotización.',
    QUOTE_OUTSIDE_BRANCH:
        'La cotización es de otra sucursal: se cobra en una caja de esa sucursal.',
    QUOTE_ALREADY_CONVERTED: 'La cotización ya se cobró.',
    // Un intento anterior de esta operación sí se registró (la red falló
    // antes de la respuesta) y este trae otros datos
    IDEMPOTENCY_KEY_REUSED:
        'La operación anterior sí se registró. Revisa las ventas y movimientos del turno antes de repetirla.',
    IDEMPOTENCY_IN_PROGRESS:
        'La operación anterior todavía se está procesando. Espera unos segundos y vuelve a intentar.',
}

export const posErrorMessage = (error: unknown, fallback: string): string =>
    getErrorMessage(error, fallback, POS_ERROR_MESSAGES)
