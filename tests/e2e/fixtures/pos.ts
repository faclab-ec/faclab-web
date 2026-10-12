import type {
    POSProduct,
    POSSale,
    QuickSaleInput,
    Receipt,
    Shift,
} from '@/features/pos/model/types'
import {
    ADMIN,
    POS,
    created,
    ok,
    paginated,
    type MockApi,
} from '../support/mockApi'
import { categories } from './catalog'

export const openShift = (overrides: Partial<Shift> = {}): Shift => ({
    id: 42,
    cashierName: 'Ana',
    openedAt: '2026-01-15T13:00:00.000Z',
    closedAt: null,
    openingBalance: 50,
    closingBalance: null,
    expectedBalance: null,
    discrepancy: null,
    status: 'OPEN',
    notes: null,
    ...overrides,
})

export const posProducts = (): POSProduct[] => [
    {
        id: 1,
        name: 'Tablero MDF 15mm',
        sku: 'TAB-MDF-15',
        barcode: '7861234567890',
        categoryId: 1,
        salePrice: 12.5,
        taxCode: 'VAT_15',
        isActive: true,
        image: null,
    },
    {
        id: 2,
        name: 'Bisagra cazoleta 35mm',
        sku: 'HER-BIS-35',
        barcode: null,
        categoryId: 2,
        salePrice: 0.95,
        taxCode: 'VAT_15',
        isActive: true,
        image: null,
    },
    {
        id: 3,
        name: 'Tirador acero 128mm',
        sku: 'HER-TIR-128',
        barcode: null,
        categoryId: 2,
        salePrice: 2.4,
        taxCode: 'VAT_15',
        isActive: true,
        image: null,
    },
]

const SALE_ID = 901

const receiptFor = (input: QuickSaleInput, total: number): Receipt => ({
    saleId: SALE_ID,
    saleDate: '2026-01-15T15:00:00.000Z',
    status: 'CONFIRMED',
    cashier: 'Ana',
    customer: null,
    isFinalConsumer: true,
    items: input.items.map((item) => ({
        productName:
            posProducts().find((product) => product.id === item.productId)
                ?.name ?? `#${item.productId}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? 0,
        discount: 0,
        discountAmount: 0,
        taxCode: 'VAT_15',
        taxAmount: 0,
        subtotal: (item.unitPrice ?? 0) * item.quantity,
        priceOverride: null,
        overrideReason: null,
    })),
    taxBreakdown: [],
    subtotal: total,
    discount: 0,
    discountType: null,
    discountValue: 0,
    tax: 0,
    total,
    payments: input.payments.map((payment) => ({
        method: payment.paymentMethod,
        amount: payment.amount,
        reference: payment.reference ?? null,
    })),
    totalPaid: total,
    change: 0,
})

/**
 * Punto de venta con un turno abierto. La venta rápida devuelve la venta y
 * deja listo su recibo, calculado con lo que envió la app.
 */
export const mockPOS = (api: MockApi, shift: Shift | null = openShift()) => {
    let receipt: Receipt | null = null

    api.get(`${POS}/shifts/active`, () => ok(shift))
    api.get(`${POS}/products`, () => ok(posProducts()))
    api.get(`${POS}/products/search`, ({ query }) => {
        const term = (query.get('term') ?? '').toLowerCase()
        return ok(
            posProducts().filter(
                (product) =>
                    product.name.toLowerCase().includes(term) ||
                    product.sku.toLowerCase().includes(term)
            )
        )
    })
    api.get(`${POS}/sales/parked`, () => ok([]))
    api.get(`${POS}/shifts/:id/cash-summary`, ({ params }) =>
        ok({
            shiftId: Number(params.id),
            openingBalance: shift?.openingBalance ?? 0,
            cashSales: 0,
            cashRefunds: 0,
            cashIn: 0,
            cashOut: 0,
            expectedBalance: shift?.openingBalance ?? 0,
        })
    )
    api.get(`${ADMIN}/categories`, ({ query }) =>
        paginated(categories(), query)
    )

    api.post(`${POS}/sales/quick`, ({ body }) => {
        const input = body as QuickSaleInput
        const total = input.payments.reduce(
            (sum, payment) => sum + payment.amount,
            0
        )
        receipt = receiptFor(input, total)
        const sale: POSSale = {
            id: SALE_ID,
            customerId: input.customerId ?? null,
            isFinalConsumer: !input.customerId,
            shiftId: shift?.id ?? 0,
            status: 'CONFIRMED',
            saleDate: receipt.saleDate,
            subtotal: total,
            tax: 0,
            discount: 0,
            discountType: null,
            discountValue: 0,
            total,
            paymentStatus: 'PAID',
            notes: null,
            createdBy: 'Ana',
            parkedAt: null,
            parkReason: null,
            createdAt: receipt.saleDate,
        }
        return created(sale)
    })
    api.get(`${POS}/sales/:id/receipt`, () => ok(receipt))
}
