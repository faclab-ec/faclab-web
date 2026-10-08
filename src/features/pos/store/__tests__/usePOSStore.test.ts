import { describe, it, expect } from 'vitest'
import { getCartTax, getCartTotal, type POSCartItem } from '../usePOSStore'

const item = (overrides: Partial<POSCartItem>): POSCartItem => ({
    productId: 1,
    name: 'Producto',
    sku: 'SKU',
    salePrice: 100,
    taxCode: 'VAT_15',
    quantity: 1,
    discount: 0,
    ...overrides,
})

describe('getCartTax', () => {
    it('applies the rate of each tax code', () => {
        const items = [
            item({ productId: 1, taxCode: 'VAT_15' }),
            item({ productId: 2, taxCode: 'VAT_5', salePrice: 20 }),
        ]
        // 100 × 15% + 20 × 5%
        expect(getCartTax(items, null, 0)).toBeCloseTo(16)
    })

    it('charges no tax for VAT_0, EXEMPT and NOT_TAXED', () => {
        const items = [
            item({ productId: 1, taxCode: 'VAT_0' }),
            item({ productId: 2, taxCode: 'EXEMPT' }),
            item({ productId: 3, taxCode: 'NOT_TAXED' }),
        ]
        expect(getCartTax(items, null, 0)).toBe(0)
    })

    it('computes tax after item and sale discounts', () => {
        const items = [
            item({
                productId: 1,
                taxCode: 'VAT_15',
                quantity: 2,
                discount: 10,
            }),
            item({ productId: 2, taxCode: 'EXEMPT', salePrice: 20 }),
        ]
        // subtotal = 180 + 20 = 200; 10% sale discount → factor 0.9
        // tax = 180 × 0.9 × 15% = 24.3
        expect(getCartTax(items, 'PERCENTAGE', 10)).toBeCloseTo(24.3)
        // total = 200 - 20 + 24.3
        expect(getCartTotal(items, 'PERCENTAGE', 10)).toBeCloseTo(204.3)
    })
})
