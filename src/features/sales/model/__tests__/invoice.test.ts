import { describe, it, expect } from 'vitest'
import { invoiceIssuedAt, invoiceNumber, type Invoice } from '../types'

describe('invoiceNumber', () => {
    it('reads establecimiento, punto de emisión and secuencial from the access code', () => {
        // fecha(8) tipo(2) ruc(13) ambiente(1) serie(6) secuencial(9) código(8) emisión(1) dígito(1)
        const accessCode = '0810202601179001234500110010020000001231234567818'
        expect(invoiceNumber(accessCode)).toBe('001-002-000000123')
    })

    it('leaves anything that is not an access code as it is', () => {
        expect(invoiceNumber('abc')).toBe('abc')
    })
})

describe('invoiceIssuedAt', () => {
    it('is the date of the first status', () => {
        const invoice = {
            statusHistory: [
                { name: 'created', statusDate: '2026-10-08T10:00:00Z' },
                { name: 'authorized', statusDate: '2026-10-08T10:01:00Z' },
            ],
        } as Invoice
        expect(invoiceIssuedAt(invoice)).toBe('2026-10-08T10:00:00Z')
    })
})
