import type { PaginationParams } from '@/@types/api'

export type PurchaseOrderStatus =
    | 'draft'
    | 'sent'
    | 'partial'
    | 'received'
    | 'cancelled'

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> =
    {
        draft: 'Borrador',
        sent: 'Enviada',
        partial: 'Parcial',
        received: 'Recibida',
        cancelled: 'Cancelada',
    }

export const PURCHASE_ORDER_STATUS_CLASSES: Record<
    PurchaseOrderStatus,
    string
> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    partial:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    received:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

export interface PurchaseOrder {
    id: number
    supplierId: number
    supplierName: string | null
    orderNumber: string
    status: PurchaseOrderStatus
    subtotal: number
    tax: number
    total: number
    notes: string | null
    expectedDate: string | null
    createdAt: string | null
    updatedAt: string | null
}

export interface PurchaseOrderInput {
    supplierId: number
    notes?: string | null
    expectedDate?: string | null
}

export interface PurchaseOrderUpdateInput {
    supplierId?: number
    notes?: string | null
    expectedDate?: string | null
}

export interface PurchaseOrderItem {
    id: number
    purchaseOrderId: number
    productId: number
    quantityOrdered: number
    quantityReceived: number
    unitCost: number
}

export interface PurchaseOrderItemInput {
    purchaseOrderId: number
    productId: number
    quantityOrdered: number
    unitCost: number
}

export interface PurchaseOrderItemUpdateInput {
    quantityOrdered: number
    unitCost: number
}

export interface PurchaseReceipt {
    id: number
    purchaseOrderId: number
    notes: string | null
    receivedAt: string | null
    createdAt: string | null
}

export interface ReceiveItemInput {
    purchaseOrderItemId: number
    quantityReceived: number
    locationId?: number | null
    lotNumber?: string | null
    serialNumbers?: string[] | null
}

export interface ReceiveInput {
    items: ReceiveItemInput[]
    notes?: string | null
    receivedAt?: string | null
}

export interface PurchaseOrderQueryParams extends PaginationParams {
    status?: PurchaseOrderStatus
    supplierId?: number
}
