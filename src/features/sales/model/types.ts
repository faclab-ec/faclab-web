import type { TaxCode } from '@/constants/tax.constant'
import type { StatusTone } from '@shared/lib/statusTone'

export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'INVOICED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID'
// SRI forms of payment, as defined by faclab-core
export const PAYMENT_METHODS = [
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'TRANSFER',
    'OTHER',
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmada',
    INVOICED: 'Facturada',
    CANCELLED: 'Cancelada',
}

export const SALE_STATUS_TONES: Record<SaleStatus, StatusTone> = {
    DRAFT: 'neutral',
    CONFIRMED: 'info',
    INVOICED: 'success',
    CANCELLED: 'danger',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PENDING: 'Pendiente',
    PARTIAL: 'Parcial',
    PAID: 'Pagado',
}

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
    PENDING: 'warning',
    PARTIAL: 'info',
    PAID: 'success',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'Efectivo',
    CREDIT_CARD: 'Tarjeta crédito',
    DEBIT_CARD: 'Tarjeta débito',
    TRANSFER: 'Transferencia',
    OTHER: 'Otro',
}

export interface Sale {
    id: number
    /** Número de la sucursal (`V-001-000123`); null en borradores y ventas anteriores */
    number: string | null
    branchId: number | null
    emissionPointId: number | null
    terminalId: number | null
    customerId: number | null
    customerName: string | null
    status: SaleStatus
    saleDate: string | null
    subtotal: number
    tax: number
    discount: number
    total: number
    paymentStatus: PaymentStatus
    notes: string | null
    createdBy: string | null
    createdAt: string
    updatedAt: string | null
}

export interface SaleItem {
    id: number
    saleId: number
    productId: number
    productName: string | null
    productSku: string | null
    quantity: number
    unitPrice: number
    discount: number
    taxCode: TaxCode
    taxAmount: number
    subtotal: number
}

export interface Payment {
    id: number
    saleId: number
    amount: number
    paymentMethod: PaymentMethod
    paymentDate: string | null
    reference: string | null
    notes: string | null
    createdAt: string
}

export interface SaleQueryParams {
    customerId?: number
    status?: SaleStatus
    limit?: number
    offset?: number
}
