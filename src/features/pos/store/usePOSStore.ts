import { create } from 'zustand'
import { TAX_CODE_RATES, type TaxCode } from '@/constants/tax.constant'

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

/** Subtotal de items (precio × cantidad × (1 - descuento_item%)), sin impuesto */
export function getCartSubtotal(items: POSCartItem[]): number {
    return items.reduce((sum, item) => {
        const lineTotal =
            item.salePrice * item.quantity * (1 - item.discount / 100)
        return sum + lineTotal
    }, 0)
}

export function getCartDiscountAmount(
    subtotal: number,
    discountType: 'PERCENTAGE' | 'AMOUNT' | null,
    discountValue: number
): number {
    if (!discountType) return 0
    if (discountType === 'PERCENTAGE') return subtotal * (discountValue / 100)
    return discountValue
}

/** Impuesto calculado por item según la tarifa de su taxCode, sobre la base después del descuento de venta */
export function getCartTax(
    items: POSCartItem[],
    discountType: 'PERCENTAGE' | 'AMOUNT' | null,
    discountValue: number
): number {
    const subtotal = getCartSubtotal(items)
    if (subtotal === 0) return 0

    const discountAmount = getCartDiscountAmount(
        subtotal,
        discountType,
        discountValue
    )
    const discountFactor =
        subtotal > 0 ? Math.max(0, subtotal - discountAmount) / subtotal : 1

    return items.reduce((sum, item) => {
        const lineSubtotal =
            item.salePrice * item.quantity * (1 - item.discount / 100)
        const lineAfterDiscount = lineSubtotal * discountFactor
        const lineTax = lineAfterDiscount * (TAX_CODE_RATES[item.taxCode] / 100)
        return sum + lineTax
    }, 0)
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
    return Math.max(0, subtotal - discount + tax)
}
