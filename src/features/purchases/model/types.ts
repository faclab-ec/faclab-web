import type { PaginationParams } from '@/@types/api'
import type { StatusTone } from '@shared/lib/statusTone'

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

export const PURCHASE_ORDER_STATUS_TONES: Record<
    PurchaseOrderStatus,
    StatusTone
> = {
    draft: 'neutral',
    sent: 'info',
    partial: 'warning',
    received: 'success',
    cancelled: 'danger',
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
    // Only in the item list of an order
    productName?: string | null
    productSku?: string | null
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
