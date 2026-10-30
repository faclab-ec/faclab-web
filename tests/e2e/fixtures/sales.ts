import type { InvoiceDiscrepancy, Sale } from '@features/sales'

export const buildSale = (overrides: Partial<Sale> = {}): Sale => ({
    id: 501,
    number: 'V-001-000501',
    branchId: 1,
    emissionPointId: 1,
    terminalId: 1,
    customerId: 10,
    customerName: 'Ana Pérez',
    status: 'CONFIRMED',
    saleDate: '2026-10-29T10:00:00',
    subtotal: 10,
    tax: 1.5,
    discount: 0,
    total: 11.5,
    paymentStatus: 'PAID',
    notes: null,
    createdBy: 'Caja Uno',
    invoiceStatus: 'PENDING',
    invoiceId: null,
    invoiceRejectionReason: null,
    invoiceRequestedAt: '2026-10-29T10:00:00',
    createdAt: '2026-10-29T10:00:00',
    updatedAt: null,
    ...overrides,
})

/** Venta confirmada que sigue sin resultado de facturación (S4.3) */
export const buildDiscrepancy = (
    overrides: Partial<InvoiceDiscrepancy> = {}
): InvoiceDiscrepancy => ({
    id: 7,
    kind: 'confirmed_without_result',
    status: 'open',
    saleId: 501,
    invoiceId: null,
    detectedAt: '2026-10-29T10:40:00',
    resolvedAt: null,
    reviewedAt: null,
    reviewedByName: null,
    reviewNote: null,
    sale: {
        id: 501,
        number: 'V-001-000501',
        status: 'CONFIRMED',
        total: 11.5,
        branchId: 1,
        saleDate: '2026-10-29T10:00:00',
        invoiceStatus: 'PENDING',
        invoiceRequestedAt: '2026-10-29T10:00:00',
    },
    ...overrides,
})
