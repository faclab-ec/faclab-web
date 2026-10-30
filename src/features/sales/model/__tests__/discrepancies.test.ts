import { describe, expect, it } from 'vitest'
import type { Invoice } from '@features/invoicing'
import { discrepancyActions, latestInvoice } from '../discrepancies'
import type { InvoiceDiscrepancy } from '../types'

const discrepancy = (
    overrides: Partial<InvoiceDiscrepancy> = {}
): InvoiceDiscrepancy => ({
    id: 1,
    kind: 'confirmed_without_result',
    status: 'open',
    saleId: 7,
    invoiceId: null,
    detectedAt: '2026-10-29T12:00:00Z',
    resolvedAt: null,
    reviewedAt: null,
    reviewedByName: null,
    reviewNote: null,
    sale: {
        id: 7,
        number: 'V-001-000007',
        status: 'CONFIRMED',
        total: 11.5,
        branchId: 1,
        saleDate: '2026-10-29T10:00:00Z',
        invoiceStatus: 'PENDING',
        invoiceRequestedAt: '2026-10-29T10:00:00Z',
    },
    ...overrides,
})

const invoice = (
    status: Invoice['status'],
    createdAt = '2026-10-29'
): Invoice => ({
    id: `inv-${status}-${createdAt}`,
    saleId: '7',
    accessCode: null,
    status,
    signatureId: null,
    authorizationNumber: null,
    authorizedAt: null,
    buyerEmail: null,
    statusHistory: [],
    issue: null,
    attempts: 0,
    nextAttemptAt: null,
    createdAt,
    updatedAt: createdAt,
})

describe('discrepancyActions', () => {
    it('resends a sale invoicing never received', () => {
        expect(discrepancyActions(discrepancy(), [])).toEqual({
            resend: true,
            retry: null,
            review: true,
        })
    })

    it('resends when every invoice was rejected or one was authorized', () => {
        expect(
            discrepancyActions(discrepancy(), [invoice('rejected')]).resend
        ).toBe(true)
        // Core never heard the result: the resend makes invoicing repeat it
        expect(
            discrepancyActions(discrepancy(), [invoice('authorized')]).resend
        ).toBe(true)
    })

    it('retries in invoicing the invoice still in progress', () => {
        const pending = invoice('pending', '2026-10-30')

        const actions = discrepancyActions(discrepancy(), [
            invoice('rejected'),
            pending,
        ])

        expect(actions).toEqual({ resend: false, retry: pending, review: true })
    })

    it('only reviews while invoicing is unknown or for a cancelled sale', () => {
        expect(discrepancyActions(discrepancy(), undefined)).toEqual({
            resend: false,
            retry: null,
            review: true,
        })
        const cancelled = discrepancy({ kind: 'authorized_on_cancelled' })
        expect(
            discrepancyActions(cancelled, [invoice('authorized')]).resend
        ).toBe(false)
    })

    it('reviews only an open one', () => {
        expect(
            discrepancyActions(discrepancy({ status: 'reviewed' }), []).review
        ).toBe(false)
    })
})

describe('latestInvoice', () => {
    it('is the newest one, or none', () => {
        const newer = invoice('pending', '2026-10-30')

        expect(latestInvoice([invoice('rejected'), newer])).toBe(newer)
        expect(latestInvoice([])).toBeNull()
    })
})
