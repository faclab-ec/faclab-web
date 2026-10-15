import type { Meta } from '@/@types/api'
import type { TaxCode } from '@/constants/tax.constant'
import type { TaxType } from '@features/customers'
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
// SRI forms of payment, as defined by faclab-core
export const POS_PAYMENT_METHODS = [
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'TRANSFER',
    'OTHER',
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
}

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

// === SHIFTS ===
export interface Shift {
    id: number
    cashierName: string
    openedAt: string
    closedAt: string | null
    openingBalance: number
    closingBalance: number | null
    expectedBalance: number | null
    discrepancy: number | null
    status: ShiftStatus
    notes: string | null
}

export interface ShiftListParams {
    status?: ShiftStatus
    limit?: number
    offset?: number
}

export interface OpenShiftInput {
    openingBalance: number
    notes?: string
}

export interface CloseShiftInput {
    closingBalance: number
    notes?: string
}

// === SALES ===
export interface POSSale {
    id: number
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
    createdAt: string
}

export interface POSSaleItem {
    id: number
    saleId: number
    productId: number
    quantity: number
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
    amount: number
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
}

export interface QuickSaleItemInput {
    productId: number
    quantity: number
    unitPrice?: number
    discount?: number
    // Required by faclab-core when unitPrice differs from the product price
    overrideReason?: string
}

export interface QuickSalePaymentInput {
    amount: number
    paymentMethod: POSPaymentMethod
    reference?: string
    notes?: string
}

export interface AddSaleItemInput {
    productId: number
    quantity: number
    unitPrice: number
    discount?: number
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
    amount: number
    paymentMethod: POSPaymentMethod
    reference?: string
    notes?: string
}

// === REFUNDS ===
export interface Refund {
    id: number
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

export interface CashSummary {
    shiftId: number
    openingBalance: number
    cashSales: number
    cashRefunds: number
    cashIn: number
    cashOut: number
    expectedBalance: number
}

// === RECEIPT ===
export interface ReceiptItem {
    productName: string
    quantity: number
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
    saleDate: string
    status: string
    cashier: string
    customer: { name: string; taxId: string } | null
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
        amount: number
        reference: string | null
    }[]
    totalPaid: number
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
    itemsSold: {
        productName: string
        sku: string
        quantity: number
        total: number
    }[]
}

export interface ZReport extends XReport {
    refundSummary: { count: number; total: number }
    cashReconciliation: Omit<CashSummary, 'shiftId'> & {
        closingBalance: number
        discrepancy: number
    }
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
