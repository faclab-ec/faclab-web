import type { ProductPresentation } from '@/features/products/model/types'
import type {
    POSCustomer,
    POSProduct,
    POSSale,
    PosTerminal,
    QuickSaleInput,
    Receipt,
    ResolvePricesInput,
    ResolvedPrice,
    Shift,
} from '@/features/pos/model/types'
import {
    ADMIN,
    POS,
    apiError,
    created,
    ok,
    paginated,
    type MockApi,
} from '../support/mockApi'
import { builderAccount } from './receivables'
import { categories } from './catalog'
import { roundMoney } from '@shared/lib/money'

/** Caja de la matriz (sucursal 1 de la sesión por defecto) */
export const posTerminal = (
    overrides: Partial<PosTerminal> = {}
): PosTerminal => ({
    id: 11,
    branchId: 1,
    emissionPointId: 1,
    defaultLocationId: 1,
    code: 'CAJA-01',
    name: 'Caja 1',
    isActive: true,
    ...overrides,
})

export const SALE_NUMBER = 'V-001-000123'

export const openShift = (overrides: Partial<Shift> = {}): Shift => ({
    id: 42,
    cashierName: 'Ana',
    terminalId: 11,
    branchId: 1,
    openedByUserId: 1,
    closedBy: null,
    openedAt: '2026-01-15T13:00:00.000Z',
    closedAt: null,
    openingBalance: 50,
    closingBalance: null,
    expectedBalance: null,
    discrepancy: null,
    status: 'OPEN',
    notes: null,
    closingNumber: null,
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
        unitSymbol: 'u',
        quantityDecimals: 0,
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
        unitSymbol: 'u',
        quantityDecimals: 0,
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
        unitSymbol: 'u',
        quantityDecimals: 0,
    },
    // Por metros (S5.1): se vende 2,5 m
    {
        id: 4,
        name: 'Cable gemelo 2x14 AWG',
        sku: 'ELE-CAB-214',
        barcode: null,
        categoryId: 1,
        salePrice: 0.85,
        taxCode: 'VAT_15',
        isActive: true,
        image: null,
        unitSymbol: 'm',
        quantityDecimals: 2,
    },
]

/** Las bisagras también vienen en caja de 50, con su código y su precio (S5.2) */
export const HINGE_BOX_BARCODE = '7861000000500'

export const hingeBox = (): ProductPresentation => ({
    id: 250,
    productId: 2,
    name: 'Caja x50',
    factor: 50,
    barcode: HINGE_BOX_BARCODE,
    salePrice: 20,
    purchasePrice: null,
    isBase: false,
    isActive: true,
    effectiveSalePrice: 20,
    effectivePurchasePrice: null,
    quantityDecimals: 0,
})

const SALE_ID = 901

/** Un maestro que compra con la lista "Mayorista" (S5.3) */
export const builder = (): POSCustomer => ({
    id: 70,
    name: 'Ferretería El Maestro',
    taxId: '1790012345001',
    taxType: 'RUC',
})

/**
 * Precios de lista por cliente y producto (S5.3): `{ [customerId]: {
 * [productId]: [precio, lista] } }`. Sin precio en la lista, el del producto o
 * el de su presentación, como la lista general sin escalas.
 */
export type ListPrices = Record<number, Record<number, [number, string]>>

export const WHOLESALE_PRICES: ListPrices = {
    70: { 1: [11, 'Mayorista'] },
}

const resolvedPrice = (
    line: ResolvePricesInput['items'][number],
    customerId: number | null,
    prices: ListPrices
): ResolvedPrice => {
    const product = posProducts().find((p) => p.id === line.productId)
    const box = line.presentationId === hingeBox().id ? hingeBox() : null
    const listed =
        customerId !== null && !box
            ? prices[customerId]?.[line.productId]
            : undefined
    return {
        productId: line.productId,
        presentationId: line.presentationId ?? null,
        quantity: line.quantity,
        unitPrice:
            listed?.[0] ??
            (box ? box.effectiveSalePrice : product?.salePrice ?? null),
        priceListId: listed ? 2 : null,
        priceListName: listed?.[1] ?? null,
        minQuantity: listed ? 0 : null,
    }
}

// Como roundMoney: 2,5 × 0,85 = 2,125 sube a 2,13 aunque el float diga 2,1249…
const cents = roundMoney

/** Total de la venta como lo calcula faclab-core: los productos llevan IVA 15% */
const totalOf = (input: QuickSaleInput) => {
    const subtotal = cents(
        input.items.reduce(
            (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity,
            0
        )
    )
    return cents(subtotal + cents(subtotal * 0.15))
}

/** Los pagos aplicados como en faclab-core: el resto del efectivo es vuelto */
const appliedPayments = (input: QuickSaleInput, total: number) => {
    let owed = total
    return input.payments.map((payment) => {
        const amount = Math.min(payment.amount, owed)
        owed = cents(owed - amount)
        return {
            method: payment.paymentMethod,
            amount,
            amountTendered: payment.amount,
            change: cents(payment.amount - amount),
            reference: payment.reference ?? null,
        }
    })
}

const receiptFor = (input: QuickSaleInput, total: number): Receipt => ({
    saleId: SALE_ID,
    number: SALE_NUMBER,
    branch: {
        establishmentCode: '001',
        name: 'Matriz',
        address: 'Av. Loja 1-23',
    },
    terminal: { code: 'CAJA-01', name: 'Caja 1' },
    saleDate: '2026-01-15T15:00:00.000Z',
    status: 'CONFIRMED',
    cashier: 'Ana',
    customer: null,
    isFinalConsumer: true,
    items: input.items.map((item) => ({
        productName:
            posProducts().find((product) => product.id === item.productId)
                ?.name ?? `#${item.productId}`,
        presentationName:
            item.presentationId === hingeBox().id ? hingeBox().name : null,
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
    payments: appliedPayments(input, total),
    totalPaid: total,
    change: cents(
        appliedPayments(input, total).reduce((sum, p) => sum + p.change, 0)
    ),
})

/**
 * Punto de venta con un turno abierto en la única caja de la matriz (la app
 * la vincula sola). La venta rápida devuelve la venta y deja listo su recibo,
 * calculado con lo que envió la app.
 */
export const mockPOS = (
    api: MockApi,
    shift: Shift | null = openShift(),
    terminals: PosTerminal[] = [posTerminal()],
    listPrices: ListPrices = {}
) => {
    let receipt: Receipt | null = null

    api.get(`${POS}/terminals`, () => ok(terminals))
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
    // Escanear la caja de bisagras la agrega con su precio
    api.get(`${POS}/products/barcode`, ({ query }) => {
        if (query.get('code') !== HINGE_BOX_BARCODE) {
            return apiError(404, 'NOT_FOUND', 'No product with that barcode')
        }
        const hinge = posProducts().find((product) => product.id === 2)!
        return ok({ product: hinge, presentation: hingeBox() })
    })
    // El carrito pide el precio de lista de sus líneas (S5.3)
    api.post(`${POS}/prices/resolve`, ({ body }) => {
        const input = body as ResolvePricesInput
        return ok(
            input.items.map((line) =>
                resolvedPrice(line, input.customerId ?? null, listPrices)
            )
        )
    })
    api.get(`${POS}/customers/search/by-tax-id`, ({ query }) =>
        query.get('taxId') === builder().taxId
            ? ok(builder())
            : apiError(404, 'NOT_FOUND', 'Customer not found')
    )
    api.get(`${POS}/sales/parked`, () => ok([]))
    // The builder buys on credit (S5.5): 380 available, 120 overdue
    api.get(`${POS}/customer-accounts/:id`, ({ params }) =>
        Number(params.id) === builder().id
            ? ok(builderAccount())
            : apiError(404, 'NOT_FOUND', 'Customer not found')
    )
    api.post(`${POS}/customer-payments`, ({ body }) => {
        const input = body as {
            customerId: number
            amount: number
            paymentMethod: string
        }
        return created({
            id: 1,
            number: 'AB-2026-0001',
            customerId: input.customerId,
            customerName: builder().name,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            reference: null,
            notes: null,
            paidAt: '2026-11-11T10:00:00',
            receivedBy: 'Ana',
            branchId: 1,
            terminalId: 11,
            shiftId: shift?.id ?? null,
            applications: [],
        })
    })
    api.get(`${POS}/shifts/:id/cash-summary`, ({ params }) =>
        ok({
            shiftId: Number(params.id),
            openingBalance: shift?.openingBalance ?? 0,
            cashSales: 0,
            cashRefunds: 0,
            customerPayments: 0,
            cashIn: 0,
            cashOut: 0,
            expectedBalance: shift?.openingBalance ?? 0,
            // Al cerrar se cuenta el efectivo (S5.9)
            byMethod: [
                {
                    paymentMethod: 'CASH',
                    paymentsTotal: 0,
                    customerPaymentsTotal: 0,
                    refundsTotal: 0,
                    expected: shift?.openingBalance ?? 0,
                },
            ],
            justificationThreshold: 1,
        })
    )
    api.get(`${ADMIN}/categories`, ({ query }) =>
        paginated(categories(), query)
    )

    api.post(`${POS}/sales/quick`, ({ body }) => {
        const input = body as QuickSaleInput
        const total = totalOf(input)
        receipt = receiptFor(input, total)
        const sale: POSSale = {
            id: SALE_ID,
            number: SALE_NUMBER,
            branchId: 1,
            emissionPointId: 1,
            terminalId: 11,
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
