import axios from 'axios'
import { isApiError } from '@/utils/errors/ApiError'

/** Textos propios por código de error, para lo que el backend dice en inglés */
export type ErrorMessages = Partial<Record<string, string>>

/** Errores que puede dar cualquier pantalla, con su texto por defecto */
const COMMON_ERROR_MESSAGES: ErrorMessages = {
    // S5.1: cada unidad de medida dice cuántos decimales admite (0 = enteras)
    QUANTITY_PRECISION_EXCEEDED:
        'La cantidad tiene más decimales de los que admite la unidad del producto.',
    // S8.4: el plan de la empresa no admite otro (sucursal, caja, usuario...)
    PLAN_LIMIT_REACHED:
        'El plan de la empresa no admite más de este recurso. Revisa Configuración → Plan y uso.',
    // S8.4: suscripción suspendida, cancelada o con la prueba vencida
    SUBSCRIPTION_READ_ONLY:
        'La suscripción de la empresa no está activa: solo se puede consultar.',
}

export function getErrorMessage(
    error: unknown,
    fallback: string,
    messages?: ErrorMessages
): string {
    // httpClient rechaza siempre con ApiError (primer error del envelope)
    if (isApiError(error)) {
        return (
            messages?.[error.code] ||
            COMMON_ERROR_MESSAGES[error.code] ||
            error.message ||
            fallback
        )
    }
    if (axios.isAxiosError(error)) {
        const data = error.response?.data
        if (data?.errors?.length > 0) {
            return data.errors[0].message || fallback
        }
        return data?.detail || data?.message || error.message || fallback
    }
    if (error instanceof Error) {
        return error.message || fallback
    }
    return fallback
}

/**
 * Id de la solicitud que falló (`meta.requestId` del envelope de error del
 * core y la facturación), para mostrarlo junto al mensaje.
 */
export function getErrorRequestId(error: unknown): string | undefined {
    if (isApiError(error)) {
        return error.requestId || undefined
    }
    if (axios.isAxiosError(error)) {
        const requestId = error.response?.data?.meta?.requestId
        return typeof requestId === 'string' && requestId
            ? requestId
            : undefined
    }
    return undefined
}
