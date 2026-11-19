import type { ErrorMessages } from '@shared/lib/getErrorMessage'

// El backend responde en inglés
export const INTEGRATION_ERROR_MESSAGES: ErrorMessages = {
    INTEGRATION_CLIENT_REVOKED:
        'El cliente está revocado: no se puede cambiar ni recibir secretos.',
    INTEGRATION_SECRET_LIMIT_REACHED:
        'El cliente ya tiene dos secretos activos. Haz que venzan los anteriores o revoca uno.',
    INTEGRATION_SECRET_REVOKED: 'Ese secreto ya estaba revocado.',
    SCOPE_NOT_IN_PLAN:
        'El plan de la empresa no incluye alguno de los permisos.',
    REFERENCE_NOT_FOUND:
        'Alguna sucursal o el cliente de integración ya no existe.',
    WEBHOOK_URL_NOT_ALLOWED:
        'La URL tiene que ser HTTPS y apuntar a una dirección pública (no localhost ni una IP privada).',
    WEBHOOK_OWNER_REQUIRED:
        'Solo un webhook de un cliente de integración puede excluir los cambios propios.',
    INSUFFICIENT_SCOPE:
        'El cliente dueño no tiene el permiso de lectura de alguno de los eventos.',
    WEBHOOK_ENDPOINT_LIMIT_REACHED:
        'La empresa ya tiene 20 webhooks. Borra uno que no uses.',
    WEBHOOK_ENDPOINT_DISABLED:
        'El webhook está desactivado: actívalo para probarlo o reenviar.',
    WEBHOOK_DELIVERY_PENDING: 'La entrega sigue pendiente: se reintenta sola.',
    WEBHOOKS_DISABLED: 'Los webhooks están apagados en este servidor.',
}
