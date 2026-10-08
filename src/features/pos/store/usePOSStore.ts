import { create } from 'zustand'
import { type TaxCode } from '@/constants/tax.constant'
import { roundMoney } from '@shared/lib/money'
import { discountFactor, taxBreakdown } from '../model/totals'

export interface POSCartItem {
    productId: number
    name: string
    sku: string
    salePrice: number
    taxCode: TaxCode
    quantity: number
    discount: number
}

interface POSState {
    cartItems: POSCartItem[]
    customerId: number | null
    customerName: string | null
    isFinalConsumer: boolean

    discountType: 'PERCENTAGE' | 'AMOUNT' | null
    discountValue: number

    selectedCategoryId: number | null
    searchTerm: string

    addItem: (product: {
        productId: number
        name: string
        sku: string
        salePrice: number
        taxCode: TaxCode
    }) => void
    updateItemQuantity: (productId: number, quantity: number) => void
    updateItemDiscount: (productId: number, discount: number) => void
    updateItemPrice: (productId: number, price: number) => void
    removeItem: (productId: number) => void
    setCustomer: (id: number | null, name: string | null) => void
    setFinalConsumer: (value: boolean) => void
    applyDiscount: (type: 'PERCENTAGE' | 'AMOUNT', value: number) => void
    clearDiscount: () => void
    clearCart: () => void
    setSelectedCategory: (categoryId: number | null) => void
    setSearchTerm: (term: string) => void
}

export const usePOSStore = create<POSState>()((set) => ({
    cartItems: [],
    customerId: null,
    customerName: null,
    isFinalConsumer: false,

    discountType: null,
    discountValue: 0,

    selectedCategoryId: null,
    searchTerm: '',

    addItem: (product) =>
        set((state) => {
            const existing = state.cartItems.find(
                (item) => item.productId === product.productId
            )
            if (existing) {
                return {
                    cartItems: state.cartItems.map((item) =>
                        item.productId === product.productId
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                }
            }
            return {
                cartItems: [
                    ...state.cartItems,
                    { ...product, quantity: 1, discount: 0 },
                ],
            }
        }),

    updateItemQuantity: (productId, quantity) =>
        set((state) => {
            if (quantity <= 0) {
                return {
                    cartItems: state.cartItems.filter(
                        (item) => item.productId !== productId
                    ),
                }
            }
            return {
                cartItems: state.cartItems.map((item) =>
                    item.productId === productId ? { ...item, quantity } : item
                ),
            }
        }),

    updateItemDiscount: (productId, discount) =>
        set((state) => ({
            cartItems: state.cartItems.map((item) =>
                item.productId === productId ? { ...item, discount } : item
            ),
        })),

    updateItemPrice: (productId, price) =>
        set((state) => ({
            cartItems: state.cartItems.map((item) =>
                item.productId === productId
                    ? { ...item, salePrice: price }
                    : item
            ),
        })),

    removeItem: (productId) =>
        set((state) => ({
            cartItems: state.cartItems.filter(
                (item) => item.productId !== productId
            ),
        })),

    setCustomer: (id, name) =>
        set({
            customerId: id,
            customerName: name,
            isFinalConsumer: false,
        }),

    setFinalConsumer: (value) => set({ isFinalConsumer: value }),

    applyDiscount: (type, value) =>
        set({ discountType: type, discountValue: value }),

    clearDiscount: () => set({ discountType: null, discountValue: 0 }),

    clearCart: () =>
        set({
            cartItems: [],
            customerId: null,
            customerName: null,
            isFinalConsumer: false,
            discountType: null,
            discountValue: 0,
        }),

    setSelectedCategory: (categoryId) =>
        set({ selectedCategoryId: categoryId }),

    setSearchTerm: (term) => set({ searchTerm: term }),
}))

/*
 * Totales del carrito. Replican `Sale.recalculate_totals` de faclab-core para que
 * el monto a cobrar coincida al centavo con el que valida el backend: las líneas
 * van a precisión completa y se redondean el subtotal, el descuento y el IVA
 * (por código), y total = subtotal - descuento + IVA.
 */

/** Monto de una línea (precio × cantidad × (1 - descuento_item%)), sin impuesto */
function lineSubtotal(item: POSCartItem): number {
    return item.salePrice * item.quantity * (1 - item.discount / 100)
}

/** Subtotal de items, sin impuesto, redondeado a centavos */
export function getCartSubtotal(items: POSCartItem[]): number {
    return roundMoney(items.reduce((sum, item) => sum + lineSubtotal(item), 0))
}

export function getCartDiscountAmount(
    subtotal: number,
    discountType: 'PERCENTAGE' | 'AMOUNT' | null,
    discountValue: number
): number {
    if (!discountType) return 0
    if (discountType === 'PERCENTAGE') {
        return roundMoney(subtotal * (discountValue / 100))
    }
    return Math.min(roundMoney(discountValue), subtotal)
}

/**
 * IVA sobre la base después del descuento de venta, que se prorratea entre los
 * items. Se redondea por código de IVA, como en la factura.
 */
export function getCartTax(
    items: POSCartItem[],
    discountType: 'PERCENTAGE' | 'AMOUNT' | null,
    discountValue: number
): number {
    const subtotal = getCartSubtotal(items)
    const discount = getCartDiscountAmount(
        subtotal,
        discountType,
        discountValue
    )
    const lines = items.map((item) => ({
        taxCode: item.taxCode,
        subtotal: lineSubtotal(item),
    }))
    return taxBreakdown(lines, discountFactor(subtotal, discount)).tax
}

/** Total = subtotal - descuento_venta + impuesto */
export function getCartTotal(
    items: POSCartItem[],
    discountType: 'PERCENTAGE' | 'AMOUNT' | null,
    discountValue: number
): number {
    const subtotal = getCartSubtotal(items)
    const discount = getCartDiscountAmount(
        subtotal,
        discountType,
        discountValue
    )
    const tax = getCartTax(items, discountType, discountValue)
    return roundMoney(subtotal - discount + tax)
}
