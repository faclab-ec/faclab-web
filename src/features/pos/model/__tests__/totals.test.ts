import { describe, it, expect } from 'vitest'
import { discountFactor, taxBreakdown } from '../totals'

describe('taxBreakdown', () => {
    it('prorates the sale discount and rounds per tax code', () => {
        const lines = [
            { taxCode: 'VAT_15' as const, subtotal: 100 },
            { taxCode: 'VAT_15' as const, subtotal: 20 },
            { taxCode: 'VAT_0' as const, subtotal: 30 },
        ]
        // factor = 135 / 150 = 0.9
        expect(taxBreakdown(lines, discountFactor(150, 15))).toEqual({
            base: 135,
            tax: 16.2,
        })
    })

    it('refunds half of a 10%-discounted sale of two units', () => {
        // Sale: 2 × 10.00 at VAT 15%, 10% off → total 20.70
        const refund = taxBreakdown(
            [{ taxCode: 'VAT_15', subtotal: 10 }],
            discountFactor(20, 2)
        )
        expect(refund).toEqual({ base: 9, tax: 1.35 })
    })

    it('uses the full base without a subtotal', () => {
        expect(discountFactor(0, 0)).toBe(1)
    })
})
