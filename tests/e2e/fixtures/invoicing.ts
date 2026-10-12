import type { Invoice, InvoicingStatus } from '@/features/invoicing/model/types'

export const invoicingReady = (
    overrides: Partial<InvoicingStatus> = {}
): InvoicingStatus => ({
    ready: true,
    environment: 2,
    certificate: {
        id: 'cert-1',
        subject: 'FACLAB DEMO S.A.',
        validTo: '2027-12-31T23:59:59.000Z',
    },
    issues: [],
    pendingInvoices: 0,
    invoicesWithIssues: 0,
    ...overrides,
})

export const invoicingNotReady = (): InvoicingStatus =>
    invoicingReady({
        ready: false,
        certificate: null,
        issues: [
            {
                code: 'CERTIFICATE_NOT_SELECTED',
                severity: 'error',
                message: 'No signing certificate selected',
            },
        ],
        pendingInvoices: 3,
        invoicesWithIssues: 3,
    })

// 49 dígitos: el número SRI (001-002-000000123) va en las posiciones 24-39
const ACCESS_CODE = '1501202601179214100100120010020000001231234567811'

export const buildInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
    id: 'inv-1',
    saleId: '501',
    accessCode: ACCESS_CODE,
    status: 'authorized',
    signatureId: 'sig-1',
    statusHistory: [
        { name: 'created', statusDate: '2026-01-15T14:00:00.000Z' },
        { name: 'authorized', statusDate: '2026-01-15T14:00:05.000Z' },
    ],
    issue: null,
    attempts: 1,
    nextAttemptAt: null,
    createdAt: '2026-01-15T14:00:00.000Z',
    updatedAt: '2026-01-15T14:00:05.000Z',
    ...overrides,
})

/** Factura detenida porque el SRI no respondió: se puede reintentar. */
export const stuckInvoice = (): Invoice =>
    buildInvoice({
        id: 'inv-2',
        saleId: '502',
        accessCode: null,
        status: 'pending',
        signatureId: null,
        statusHistory: [],
        issue: {
            code: 'SRI_UNAVAILABLE',
            message: 'SRI did not respond',
            at: '2026-01-15T14:30:00.000Z',
        },
        attempts: 3,
        nextAttemptAt: '2026-01-15T15:30:00.000Z',
        createdAt: '2026-01-15T14:20:00.000Z',
        updatedAt: '2026-01-15T14:30:00.000Z',
    })
