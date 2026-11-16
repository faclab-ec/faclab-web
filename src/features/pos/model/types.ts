import type { ProductPresentation } from '@features/products'
import type { Meta } from '@/@types/api'
import type { TaxCode } from '@/constants/tax.constant'
import type { TaxType } from '@features/customers'
import type { CreditNote } from '@features/invoicing'
import type { SaleInvoiceStatus } from '@features/sales'
import type { Quote, QuoteItem, QuoteSummary } from '@features/quotes'
import type { StatusTone } from '@shared/lib/statusTone'

// === ENUMS ===
export type ShiftStatus = 'OPEN' | 'CLOSED'
export type POSSaleStatus = 'DRAFT' | 'CONFIRMED' | 'INVOICED' | 'CANCELLED'
// Confirmed sales can be refunded whether or not the SRI already authorized
// their invoice (faclab-core then marks them INVOICED)
export const REFUNDABLE_SALE_STATUSES: readonly POSSaleStatus[] = [
    'CONFIRMED',
    'INVOICED',
]
export type POSPaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID'
// SRI forms of payment, as defined by faclab-core. CREDIT (S5.5) leaves its
// amount on the customer's account, within its credit limit
export const POS_PAYMENT_METHODS = [
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'TRANSFER',
    'OTHER',
    'CREDIT',
] as const
export type POSPaymentMethod = (typeof POS_PAYMENT_METHODS)[number]
export type CashMovementType = 'IN' | 'OUT'
export type RefundStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'
export type DiscountType = 'PERCENTAGE' | 'AMOUNT'

// === LABELS ===
export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
    OPEN: 'Abierto',
    CLOSED: 'Cerrado',
}

export const SHIFT_STATUS_TONES: Record<ShiftStatus, StatusTone> = {
    OPEN: 'success',
    CLOSED: 'neutral',
}

export const POS_SALE_STATUS_LABELS: Record<POSSaleStatus, string> = {
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmada',
    INVOICED: 'Facturada',
    CANCELLED: 'Cancelada',
}

export const POS_SALE_STATUS_TONES: Record<POSSaleStatus, StatusTone> = {
    DRAFT: 'neutral',
    CONFIRMED: 'info',
    INVOICED: 'success',
    CANCELLED: 'danger',
}

export const POS_PAYMENT_STATUS_LABELS: Record<POSPaymentStatus, string> = {
    PENDING: 'Pendiente',
    PARTIAL: 'Parcial',
    PAID: 'Pagado',
}

export const POS_PAYMENT_STATUS_TONES: Record<POSPaymentStatus, StatusTone> = {
    PENDING: 'warning',
    PARTIAL: 'info',
    PAID: 'success',
}

export const POS_PAYMENT_METHOD_LABELS: Record<POSPaymentMethod, string> = {
    CASH: 'Efectivo',
    CREDIT_CARD: 'Tarjeta crédito',
    DEBIT_CARD: 'Tarjeta débito',
    TRANSFER: 'Transferencia',
    OTHER: 'Otro',
    CREDIT: 'Crédito',
}

/** Con qué se devuelve dinero: lo que va a la cuenta lo decide faclab-core */
export const REFUND_PAYMENT_METHODS = POS_PAYMENT_METHODS.filter(
    (method) => method !== 'CREDIT'
)

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
    IN: 'Ingreso',
    OUT: 'Egreso',
}

export const CASH_MOVEMENT_TYPE_TONES: Record<CashMovementType, StatusTone> = {
    IN: 'success',
    OUT: 'danger',
}

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
}

export const REFUND_STATUS_TONES: Record<RefundStatus, StatusTone> = {
    PENDING: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
}

// === TERMINALS ===
// Una caja es de organización: el POS solo lee las de su sucursal
export type { PosTerminal } from '@features/organization'

// === SHIFTS ===
export interface Shift {
    id: number
    cashierName: string
    /** Null solo en turnos anteriores a las cajas por terminal */
    terminalId: number | null
    branchId: number | null
    openedByUserId: number | null
    closedBy: string | null
    openedAt: string
    closedAt: string | null
    openingBalance: number
    closingBalance: number | null
    expectedBalance: number | null
    discrepancy: number | null
    status: ShiftStatus
    notes: string | null
    /** Número de su cierre Z (S5.9); null abierto o cerrado antes de S5.9 */
    closingNumber: string | null
}

export interface ShiftListParams {
    status?: ShiftStatus
    branchId?: number
    terminalId?: number
    limit?: number
    offset?: number
}

export interface OpenShiftInput {
    openingBalance: number
    notes?: string
}

/** Medios que se cuentan al cerrar: todos menos CREDIT, que no entra en caja */
export type CountablePaymentMethod = Exclude<POSPaymentMethod, 'CREDIT'>

/** Lo que el cajero contó de un medio de pago al cerrar (S5.9) */
export interface ShiftCountInput {
    paymentMethod: CountablePaymentMethod
    counted: number
    /** Obligatoria si la diferencia supera el umbral */
    justification?: string
}

export interface CloseShiftInput {
    /** El efectivo y cada medio que el turno movió, menos CREDIT */
    counts: ShiftCountInput[]
    notes?: string
}

// === SALES ===
export interface POSSale {
    id: number
    /** Número de la sucursal (`V-001-000123`), asignado al confirmar */
    number: string | null
    branchId: number | null
    emissionPointId: number | null
    terminalId: number | null
    customerId: number | null
    isFinalConsumer: boolean
    shiftId: number
    status: POSSaleStatus
    saleDate: string | null
    subtotal: number
    tax: number
    discount: number
    discountType: DiscountType | null
    discountValue: number
    total: number
    paymentStatus: POSPaymentStatus
    notes: string | null
    createdBy: string | null
    parkedAt: string | null
    parkReason: string | null
    /** La factura de la venta; null si nunca se envió */
    invoiceStatus?: SaleInvoiceStatus | null
    createdAt: string
}

export interface POSSaleItem {
    id: number
    saleId: number
    productId: number
    /** In its presentation (S5.2), like the price */
    quantity: number
    /** Null in lines from before S5.2, in base units */
    presentationId?: number | null
    presentationName?: string | null
    /** Base units in one of its presentation */
    unitFactor?: number
    /** What moved the stock: quantity × unitFactor */
    baseQuantity?: number
    unitPrice: number
    discount: number
    taxCode: TaxCode
    taxAmount: number
    subtotal: number
    priceOverride: number | null
    overrideReason: string | null
}

export interface POSPayment {
    id: number
    saleId: number
    /** Lo aplicado a la venta: lo entregado menos el vuelto */
    amount: number
    /** Lo que entregó el cliente */
    amountTendered: number
    /** Solo en efectivo */
    change: number
    paymentMethod: POSPaymentMethod
    paymentDate: string
    reference: string | null
    notes: string | null
}

// === INPUTS ===
export interface CreateSaleInput {
    customerId?: number | null
    isFinalConsumer?: boolean
    notes?: string
}

export interface QuickSaleInput {
    customerId?: number | null
    items: QuickSaleItemInput[]
    payments: QuickSalePaymentInput[]
    discountType?: DiscountType
    discountValue?: number
    notes?: string
    /** The quote it charges (S5.4): with its customer and its same items */
    quoteId?: number
}

/** A quote line as the POS sees it before charging it (S5.4) */
export interface PosQuoteItem extends QuoteItem {
    /** Today's price for its customer (null: none) */
    listPrice: number | null
    priceListName: string | null
    /** The quoted price is not today's */
    priceChanged: boolean
    /** Available at the terminal's location, base units, not reserved */
    availableQuantity: number
    /** It covers what the quote's lines of the product take together */
    enoughStock: boolean
}

export interface PosQuote extends Omit<Quote, 'items'> {
    items: PosQuoteItem[]
    expired: boolean
}

export type PosQuoteSummary = QuoteSummary

export interface PosQuoteParams {
    search?: string
    limit?: number
    offset?: number
}

export interface QuickSaleItemInput {
    productId: number
    /** The presentation it is sold in (S5.2); omitted: the base unit */
    presentationId?: number | null
    quantity: number
    unitPrice?: number
    discount?: number
    // Required by faclab-core when unitPrice differs from the presentation price
    overrideReason?: string
}

export interface QuickSalePaymentInput {
    /** Lo que entrega el cliente: faclab-core aplica lo que falta y el resto en efectivo es vuelto */
    amount: number
    paymentMethod: POSPaymentMethod
    reference?: string
    notes?: string
}

export interface AddSaleItemInput {
    productId: number
    presentationId?: number | null
    quantity: number
    /** Without it, the price of its list; another one needs `overrideReason` (S5.3) */
    unitPrice?: number
    discount?: number
    overrideReason?: string
}

/** A cart line whose price the POS asks for (S5.3) */
export interface PriceLineInput {
    productId: number
    presentationId?: number | null
    quantity: number
}

export interface ResolvePricesInput {
    /** None: a final consumer (the branch's or the general list) */
    customerId?: number | null
    items: PriceLineInput[]
}

/** The price a line takes: its customer's list, its branch's or the general one */
export interface ResolvedPrice {
    productId: number
    presentationId: number | null
    quantity: number
    /** Null when neither a list nor the product has a price */
    unitPrice: number | null
    /** Null: the product's price (the general list without a tier) */
    priceListId: number | null
    priceListName: string | null
    minQuantity: number | null
}

export interface UpdateSaleItemInput {
    quantity?: number
    discount?: number
}

export interface SaleDiscountInput {
    discountType: DiscountType
    discountValue: number
}

export interface PriceOverrideInput {
    newPrice: number
    reason: string
}

export interface PaymentInput {
    /** Lo que entrega el cliente, como en QuickSalePaymentInput */
    amount: number
    paymentMethod: POSPaymentMethod
    reference?: string
    notes?: string
}

// === REFUNDS ===
export interface Refund {
    id: number
    /** Número de la sucursal (`D-001-000045`), asignado al procesar */
    number: string | null
    branchId: number | null
    terminalId: number | null
    originalSaleId: number
    shiftId: number
    refundDate: string | null
    subtotal: number
    tax: number
    total: number
    reason: string | null
    status: RefundStatus
    refundedBy: string | null
    createdAt: string | null
    /** Su nota de crédito; null si la venta aún no tiene factura autorizada */
    creditNote?: CreditNote | null
    /**
     * De una venta a crédito (S5.5): lo que procesarla acreditaría a la cuenta
     * del cliente (después, lo que acreditó). Los pagos devuelven el resto
     */
    accountCredit?: number
}

export interface RefundDetail extends Refund {
    items: RefundItem[]
}

export interface RefundListParams {
    saleId?: number
    status?: RefundStatus
    limit?: number
    offset?: number
}

export interface RefundItem {
    id: number
    refundId: number
    originalSaleItemId: number
    productId: number
    quantity: number
    unitPrice: number
    discount: number
    taxCode: TaxCode
    taxAmount: number
    subtotal: number
}

export interface CreateRefundInput {
    originalSaleId: number
    items: { saleItemId: number; quantity: number }[]
    reason?: string
}

export interface ProcessRefundInput {
    payments: {
        amount: number
        paymentMethod: POSPaymentMethod
        reference?: string
    }[]
}

// === CASH MOVEMENTS ===
export interface CashMovement {
    id: number
    shiftId: number
    type: CashMovementType
    amount: number
    reason: string | null
    performedBy: string | null
    createdAt: string
}

export interface CashMovementInput {
    type: CashMovementType
    amount: number
    reason?: string
}

/** El efectivo de un turno */
export interface CashTotals {
    openingBalance: number
    cashSales: number
    cashRefunds: number
    /** Abonos de clientes en efectivo recibidos en el turno (S5.5) */
    customerPayments: number
    cashIn: number
    cashOut: number
    expectedBalance: number
}

/** Lo que un medio de pago debería tener al cerrar (S5.9) */
export interface MethodExpected {
    paymentMethod: CountablePaymentMethod
    paymentsTotal: number
    customerPaymentsTotal: number
    refundsTotal: number
    /** CASH: el saldo esperado; otros: pagos + abonos − devoluciones */
    expected: number
}

export interface CashSummary extends CashTotals {
    shiftId: number
    /** Qué contar al cerrar: el efectivo siempre y cada medio que se movió */
    byMethod: MethodExpected[]
    /** Una diferencia mayor que esto exige justificación */
    justificationThreshold: number
}

// === RECEIPT ===
export interface ReceiptItem {
    productName: string
    /** Presentation it was sold in (Caja x100); null in the base unit */
    presentationName?: string | null
    quantity: number
    baseQuantity?: number
    unitPrice: number
    discount: number
    discountAmount: number
    taxCode: TaxCode
    taxAmount: number
    subtotal: number
    priceOverride: number | null
    overrideReason: string | null
}

export interface Receipt {
    saleId: number
    /** Null en ventas anteriores a la numeración por sucursal */
    number: string | null
    branch: {
        establishmentCode: string
        name: string
        address: string | null
    } | null
    terminal: { code: string; name: string } | null
    saleDate: string
    status: string
    cashier: string
    customer: { name: string; taxId: string; address?: string | null } | null
    isFinalConsumer: boolean
    items: ReceiptItem[]
    taxBreakdown: {
        taxCode: TaxCode
        taxRate: number
        taxableBase: number
        taxAmount: number
    }[]
    subtotal: number
    discount: number
    discountType: DiscountType | null
    discountValue: number
    tax: number
    total: number
    payments: {
        method: string
        /** Lo aplicado a la venta */
        amount: number
        /** Lo que entregó el cliente */
        amountTendered: number
        change: number
        reference: string | null
        /** Días de plazo de un pago CREDIT (S5.5) */
        termDays?: number | null
    }[]
    /** Lo aplicado por los pagos: el total de una venta confirmada */
    totalPaid: number
    /** El vuelto que guardó faclab-core al cobrar */
    change: number
}

// === REPORTS ===
export interface ShiftInfo {
    id: number
    cashierName: string
    openedAt: string
    status: ShiftStatus
}

export interface XReport {
    shift: ShiftInfo
    salesSummary: {
        count: number
        subtotal: number
        tax: number
        discount: number
        total: number
    }
    paymentsByMethod: {
        paymentMethod: string
        count: number
        total: number
    }[]
    /** Abonos de clientes del turno por medio de pago (S5.5) */
    customerPaymentsByMethod: {
        paymentMethod: string
        count: number
        total: number
    }[]
    itemsSold: {
        productName: string
        sku: string
        quantity: number
        total: number
    }[]
}

/** El arqueo de un medio en el cierre Z */
export interface ClosingCount {
    paymentMethod: CountablePaymentMethod
    expected: number
    counted: number
    /** Contado − esperado */
    difference: number
    justification: string | null
}

/** El cierre Z guardado al cerrar el turno (S5.9): no se recalcula */
export interface ShiftClosing {
    id: number
    /** Z-001-CAJA-01-000012: establecimiento, caja y correlativo por caja */
    number: string
    closedAt: string
    closedBy: string | null
    justificationThreshold: number
    notes: string | null
    counts: ClosingCount[]
}

export interface ZReport extends XReport {
    refundSummary: { count: number; total: number }
    cashReconciliation: CashTotals & {
        closingBalance: number | null
        discrepancy: number | null
    }
    /** Null en un turno abierto o cerrado antes de S5.9: entonces se calcula */
    closing: ShiftClosing | null
}

export interface DailyReport {
    date: string
    totalSales: number
    totalAmount: number
    paymentsByMethod: {
        paymentMethod: string
        count: number
        total: number
    }[]
    topProducts: {
        productName: string
        sku: string
        quantity: number
        total: number
    }[]
    refundSummary: { count: number; total: number }
}

export interface PaymentMethodSummary {
    paymentMethod: string
    salesCount: number
    totalAmount: number
}

// === POS PRODUCT ===
export interface POSProduct {
    id: number
    name: string
    sku: string
    barcode: string | null
    categoryId: number | null
    salePrice: number | null
    taxCode: TaxCode
    isActive: boolean
    image: string | null
    // Its unit of measure (S5.1): 2,5 m of cable
    unitSymbol: string | null
    quantityDecimals: number
    /** Its presentations (S5.2): the base unit first, then boxes and rolls */
    presentations?: ProductPresentation[]
}

/** What a scanned barcode is: the product and the presentation it sells */
export interface POSBarcodeMatch {
    product: POSProduct
    presentation: ProductPresentation
}

// === POS CUSTOMER ===
export interface POSCustomer {
    id: number
    name: string
    taxId: string
    taxType: string
}

export interface QuickCustomerInput {
    name: string
    taxId: string
    taxType: TaxType
}

// === SHARED ===
export interface ListResponse<T> {
    data: T[]
    meta: Meta
}
