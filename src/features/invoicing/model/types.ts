import type { StatusTone } from '@shared/lib/statusTone'

export interface Certificate {
    id: string
    /** RUC o cédula que nombra el certificado; firma solo para ese RUC */
    taxIds: string[]
    serialNumber: string
    subject: string
    issuer: string
    validFrom: string
    validTo: string
    fileName: string
    uploadedAt: string
}

// Values defined by faclab-invoicing
export const RIMPE_REGIMES = ['EMPRENDEDOR', 'NEGOCIO_POPULAR'] as const
export type RimpeRegime = (typeof RIMPE_REGIMES)[number]

export const RIMPE_REGIME_LABELS: Record<RimpeRegime, string> = {
    EMPRENDEDOR: 'RIMPE emprendedor',
    NEGOCIO_POPULAR: 'RIMPE negocio popular',
}

/**
 * Perfil fiscal de la empresa de la sesión (uno por empresa). El
 * establecimiento, su dirección y el punto de emisión de cada factura llegan
 * con la venta; sus secuenciales se fijan aparte (`SriSequence`).
 */
export interface CompanyConfig {
    taxId: string
    name: string
    tradeName: string
    mainAddress: string
    specialTaxpayerResolution: string | null
    withholdingAgentResolution: string | null
    rimpeRegime: RimpeRegime | null
    accountingRequired: boolean
    environment: 1 | 2
    emissionType: 1
    signingCertId: string | null
    updatedAt: string
}

export interface CompanyConfigInput {
    taxId: string
    name: string
    tradeName: string
    mainAddress: string
    // Vacías se omiten: así se borran
    specialTaxpayerResolution?: string
    withholdingAgentResolution?: string
    rimpeRegime: RimpeRegime | null
    accountingRequired?: boolean
    environment: 1 | 2
    emissionType: 1
    signingCertId: string | null
}

/** Contador de facturas de un establecimiento y punto de emisión */
export interface SriSequence {
    establishment: string
    emissionPoint: string
    /** `01`: factura */
    docType: string
    /** Último número emitido (9 dígitos); null antes del primero */
    lastSequence: string | null
    /** Número de la próxima factura */
    nextSequence: number
}

// --- Invoices (faclab-invoicing) ---

export type InvoiceStatus =
    | 'pending'
    | 'created'
    | 'signed'
    | 'sent'
    | 'authorized'
    | 'rejected'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    pending: 'Pendiente',
    created: 'Creada',
    signed: 'Firmada',
    sent: 'Enviada',
    authorized: 'Autorizada',
    rejected: 'Rechazada',
}

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, StatusTone> = {
    pending: 'warning',
    created: 'neutral',
    signed: 'info',
    sent: 'warning',
    authorized: 'success',
    rejected: 'danger',
}

// Issuer problems: invoices wait until the config or the certificate is fixed
export type ReadinessErrorCode =
    | 'CONFIG_MISSING'
    | 'CONFIG_INVALID'
    | 'ENVIRONMENT_NOT_ALLOWED'
    | 'CERTIFICATE_NOT_SELECTED'
    | 'CERTIFICATE_NOT_FOUND'
    | 'CERTIFICATE_EXPIRED'
    | 'CERTIFICATE_UNREADABLE'
    | 'CERTIFICATE_RUC_MISMATCH'
    | 'ISSUER_RUC_MISMATCH'

export type ReadinessWarningCode =
    | 'CERTIFICATE_EXPIRING_SOON'
    | 'TEST_ENVIRONMENT'

// Why an invoice is stuck; the SRI ones are retried automatically
export type InvoiceIssueCode =
    | ReadinessErrorCode
    | 'SRI_UNAVAILABLE'
    | 'SRI_PROCESSING'
    | 'UNEXPECTED_ERROR'

// faclab-invoicing writes technical messages in English: these are for users
export const ISSUE_LABELS: Record<
    InvoiceIssueCode | ReadinessWarningCode,
    string
> = {
    CONFIG_MISSING: 'Falta el perfil fiscal de la empresa',
    CONFIG_INVALID: 'El perfil fiscal tiene datos inválidos (RUC)',
    ENVIRONMENT_NOT_ALLOWED:
        'Este servidor solo llega al ambiente de pruebas del SRI: cambia el ambiente a pruebas',
    CERTIFICATE_NOT_SELECTED: 'No hay un certificado de firma seleccionado',
    CERTIFICATE_NOT_FOUND: 'El certificado de firma seleccionado no existe',
    CERTIFICATE_EXPIRED: 'El certificado de firma está vencido',
    CERTIFICATE_UNREADABLE:
        'El certificado de firma no se puede abrir: vuelve a subirlo con su contraseña',
    CERTIFICATE_RUC_MISMATCH:
        'El certificado de firma es de otro RUC: selecciona uno de la empresa',
    ISSUER_RUC_MISMATCH:
        'La venta es de un RUC distinto al del perfil fiscal: revisa el RUC del perfil',
    SRI_UNAVAILABLE: 'El SRI no respondió',
    SRI_PROCESSING: 'El SRI aún está procesando la factura',
    UNEXPECTED_ERROR: 'Error inesperado al procesar la factura',
    CERTIFICATE_EXPIRING_SOON: 'El certificado de firma vence pronto',
    TEST_ENVIRONMENT:
        'Las facturas se emiten en el ambiente de pruebas del SRI: no tienen validez tributaria',
}

export function issueLabel(code: string): string {
    return ISSUE_LABELS[code as InvoiceIssueCode] ?? code
}

const READINESS_ERROR_CODES: readonly string[] = [
    'CONFIG_MISSING',
    'CONFIG_INVALID',
    'ENVIRONMENT_NOT_ALLOWED',
    'CERTIFICATE_NOT_SELECTED',
    'CERTIFICATE_NOT_FOUND',
    'CERTIFICATE_EXPIRED',
    'CERTIFICATE_UNREADABLE',
    'CERTIFICATE_RUC_MISMATCH',
    'ISSUER_RUC_MISMATCH',
]

/** The invoice waits for the fiscal config or the certificate, not for the SRI */
export function isIssuerIssue(code: string): code is ReadinessErrorCode {
    return READINESS_ERROR_CODES.includes(code)
}

export interface InvoiceIssue {
    code: InvoiceIssueCode
    message: string
    at: string
}

export interface InvoiceStatusHistoryEntry {
    name: string
    statusDate: string
    description?: string
}

export interface Invoice {
    id: string
    saleId: string
    // Null while pending: built with the XML
    accessCode: string | null
    status: InvoiceStatus
    signatureId: string | null
    statusHistory: InvoiceStatusHistoryEntry[]
    issue: InvoiceIssue | null
    attempts: number
    nextAttemptAt: string | null
    createdAt: string
    updatedAt: string
}

// GET /api/invoices: one page, latest first
export interface InvoiceQueryParams {
    // Only pending ones or those whose last attempt failed, latest change first
    attention?: boolean
    status?: InvoiceStatus
    limit?: number
    offset?: number
}

export const isFinalInvoice = (invoice: Invoice) =>
    invoice.status === 'authorized' || invoice.status === 'rejected'

export interface ReadinessIssue {
    code: ReadinessErrorCode | ReadinessWarningCode
    severity: 'error' | 'warning'
    message: string
}

// GET /api/invoicing/status
export interface InvoicingStatus {
    ready: boolean
    environment: 1 | 2 | null
    certificate: { id: string; subject: string; validTo: string } | null
    issues: ReadinessIssue[]
    // Not yet authorized or rejected
    pendingInvoices: number
    // Of those, the ones whose last attempt failed
    invoicesWithIssues: number
}

// The SRI number (establecimiento-punto de emisión-secuencial) is part of the
// 49-digit access code
export function invoiceNumber(accessCode: string | null): string {
    if (!accessCode) return '-'
    if (accessCode.length !== 49) return accessCode
    return `${accessCode.slice(24, 27)}-${accessCode.slice(
        27,
        30
    )}-${accessCode.slice(30, 39)}`
}

// When its XML was built (the emission date); null while pending
export function invoiceIssuedAt(invoice: Invoice): string | null {
    return (
        invoice.statusHistory.find((entry) => entry.name === 'created')
            ?.statusDate ?? null
    )
}
