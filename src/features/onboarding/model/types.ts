/** GET /api/admin/onboarding (faclab-core): lo que la empresa ya tiene armado */
export interface CoreChecklistStep {
    key: 'branches' | 'emission_points' | 'terminals' | 'users' | 'import'
    done: boolean
    count: number
    required: boolean
}

export interface CoreChecklist {
    steps: CoreChecklistStep[]
    ready: boolean
}

export type TestInvoiceStatus =
    | 'NONE'
    | 'PROCESSING'
    | 'AUTHORIZED'
    | 'REJECTED'

/** GET/POST /api/invoicing/test-invoice (faclab-invoicing) */
export interface TestInvoice {
    status: TestInvoiceStatus
    id: string | null
    number: string | null
    authorizedAt: string | null
    reason: string | null
}

export const TEST_INVOICE_STATUS_LABELS: Record<TestInvoiceStatus, string> = {
    NONE: 'Sin factura de prueba',
    PROCESSING: 'En proceso en el SRI…',
    AUTHORIZED: 'Autorizada por el SRI',
    REJECTED: 'Rechazada',
}

/** Textos de los errores del asistente, que el servidor dice en inglés */
export const ONBOARDING_ERROR_MESSAGES: Record<string, string> = {
    ISSUER_NOT_CONFIGURED: 'Primero guarda el perfil fiscal.',
    ISSUER_NOT_READY:
        'La facturación todavía no está lista: revisa el perfil fiscal y el certificado.',
    TEST_INVOICE_ONLY_IN_TESTING:
        'La factura de prueba solo se emite en el ambiente de pruebas del SRI.',
    TEST_INVOICE_REQUIRED:
        'Antes de pasar a producción, emite una factura de prueba y espera a que el SRI la autorice.',
    CONFIRMATION_MISMATCH:
        'El RUC no coincide con el de la empresa o falta aceptar.',
    ALREADY_IN_PRODUCTION: 'La empresa ya emite en producción.',
    ENVIRONMENT_NOT_ALLOWED:
        'Este servidor solo puede conectarse al ambiente de pruebas del SRI.',
    USE_GO_LIVE:
        'El ambiente de producción se activa solo desde el asistente de puesta en marcha.',
}
