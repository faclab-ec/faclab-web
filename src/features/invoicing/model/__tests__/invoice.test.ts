import { describe, it, expect } from 'vitest'
import {
    invoiceIssuedAt,
    invoiceNumber,
    isIssuerIssue,
    issueLabel,
    type Invoice,
} from '../types'

describe('invoiceNumber', () => {
    it('reads establecimiento, punto de emisión and secuencial from the access code', () => {
        // fecha(8) tipo(2) ruc(13) ambiente(1) serie(6) secuencial(9) código(8) emisión(1) dígito(1)
        const accessCode = '0810202601179001234500110010020000001231234567818'
        expect(invoiceNumber(accessCode)).toBe('001-002-000000123')
    })

    it('leaves anything that is not an access code as it is', () => {
        expect(invoiceNumber('abc')).toBe('abc')
    })

    it('has no number while pending', () => {
        expect(invoiceNumber(null)).toBe('-')
    })
})

describe('invoiceIssuedAt', () => {
    it('is when its XML was built', () => {
        const invoice = {
            statusHistory: [
                { name: 'pending', statusDate: '2026-10-08T09:00:00Z' },
                { name: 'created', statusDate: '2026-10-08T10:00:00Z' },
                { name: 'authorized', statusDate: '2026-10-08T10:01:00Z' },
            ],
        } as Invoice
        expect(invoiceIssuedAt(invoice)).toBe('2026-10-08T10:00:00Z')
    })

    it('is null while pending', () => {
        const invoice = {
            statusHistory: [
                { name: 'pending', statusDate: '2026-10-08T09:00:00Z' },
            ],
        } as Invoice
        expect(invoiceIssuedAt(invoice)).toBeNull()
    })
})

describe('issues', () => {
    it('tells issuer problems from SRI ones', () => {
        expect(isIssuerIssue('CERTIFICATE_EXPIRED')).toBe(true)
        expect(isIssuerIssue('SRI_UNAVAILABLE')).toBe(false)
    })

    it('labels known codes in Spanish and leaves unknown ones as they are', () => {
        expect(issueLabel('CONFIG_MISSING')).toBe(
            'Falta la configuración fiscal de la empresa'
        )
        expect(issueLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW')
    })
})
