import type { ErrorMessages } from '@shared/lib/getErrorMessage'

// faclab-invoicing responde en inglés
export const INVOICING_ERROR_MESSAGES: ErrorMessages = {
    ISSUER_NOT_CONFIGURED:
        'Primero guarda el perfil fiscal: el certificado se valida contra su RUC.',
    CERTIFICATE_RUC_MISMATCH:
        'El certificado es de otro RUC: sube uno de la empresa.',
    CERTIFICATE_RUC_UNKNOWN:
        'El certificado no indica ningún RUC ni cédula: no sirve para firmar facturas.',
    CERTIFICATE_IN_USE:
        'El certificado está en uso: selecciona otro en el Perfil fiscal antes de eliminarlo.',
    SEQUENCE_CANNOT_GO_BACK:
        'Ya se emitió una factura con ese número o uno mayor: el secuencial no retrocede.',
    INVOICE_NOT_AUTHORIZED: 'La factura todavía no está autorizada por el SRI.',
    EMAIL_DISABLED:
        'El envío de facturas por correo está desactivado en este servidor.',
    BUYER_EMAIL_MISSING:
        'El comprador de la venta no tiene un correo válido: no hay a dónde enviarla.',
    LOGO_INVALID:
        'El logo debe ser una imagen PNG o JPEG de hasta 2000 × 2000 píxeles.',
    LOGO_TOO_LARGE: 'El logo pesa más de 300 KB.',
    STORAGE_UNAVAILABLE:
        'El almacenamiento de documentos no responde: intenta de nuevo en unos minutos.',
}
