import type { TaxCode } from '@/constants/tax.constant'

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

export const SALE_STATUS_CLASSES: Record<SaleStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
    CONFIRMED:
        'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    INVOICED:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PENDING: 'Pendiente',
    PARTIAL: 'Parcial',
    PAID: 'Pagado',
}

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
    PENDING:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    PARTIAL: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'Efectivo',
    CREDIT_CARD: 'Tarjeta crédito',
    DEBIT_CARD: 'Tarjeta débito',
    TRANSFER: 'Transferencia',
    OTHER: 'Otro',
}

export type InvoiceStatus =
    | 'created'
    | 'signed'
    | 'sent'
    | 'authorized'
    | 'rejected'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    created: 'Creada',
    signed: 'Firmada',
    sent: 'Enviada',
    authorized: 'Autorizada',
    rejected: 'Rechazada',
}

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
    created: 'bg-gray-100 text-gray-600',
    signed: 'bg-blue-100 text-blue-600',
    sent: 'bg-yellow-100 text-yellow-600',
    authorized: 'bg-emerald-100 text-emerald-600',
    rejected: 'bg-red-100 text-red-600',
}

export interface InvoiceStatusHistoryEntry {
    name: string
    statusDate: string
    description?: string
}

export interface Invoice {
    id: string
    saleId: string
    accessCode: string
    status: InvoiceStatus
    signatureId: string
    statusHistory: InvoiceStatusHistoryEntry[]
}

export interface Sale {
    id: number
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
