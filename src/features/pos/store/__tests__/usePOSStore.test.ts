import { describe, it, expect } from 'vitest'
import {
    getCartDiscountAmount,
    getCartSubtotal,
    getCartTax,
    getCartTotal,
    type POSCartItem,
} from '../usePOSStore'

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

// Same cases as tests/unit/sales/test_services.py in faclab-core
describe('cart totals match the backend rounding', () => {
    it('keeps lines exact and rounds the sale to cents', () => {
        const items = [item({ salePrice: 0.15, quantity: 3 })]
        // subtotal 0.45, VAT 0.0675 → 0.07
        expect(getCartSubtotal(items)).toBe(0.45)
        expect(getCartTax(items, null, 0)).toBe(0.07)
        expect(getCartTotal(items, null, 0)).toBe(0.52)
    })

    it('rounds a percentage discount and the VAT after it', () => {
        const items = [item({ salePrice: 10 })]
        // discount 0.333 → 0.33; VAT 1.5 × 9.67 / 10 = 1.4505 → 1.45
        expect(getCartDiscountAmount(10, 'PERCENTAGE', 3.33)).toBe(0.33)
        expect(getCartTax(items, 'PERCENTAGE', 3.33)).toBe(1.45)
        expect(getCartTotal(items, 'PERCENTAGE', 3.33)).toBe(11.12)
    })

    it('rounds VAT per tax code', () => {
        const items = [
            item({ productId: 1, salePrice: 0.1, taxCode: 'VAT_5' }),
            item({ productId: 2, salePrice: 0.1, taxCode: 'VAT_15' }),
        ]
        // 0.005 → 0.01 and 0.015 → 0.02
        expect(getCartTax(items, null, 0)).toBe(0.03)
        expect(getCartTotal(items, null, 0)).toBe(0.23)
    })

    it('caps an amount discount at the subtotal', () => {
        const items = [item({ salePrice: 100 })]
        expect(getCartDiscountAmount(100, 'AMOUNT', 500)).toBe(100)
        expect(getCartTotal(items, 'AMOUNT', 500)).toBe(0)
    })
})
