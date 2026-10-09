import type { PaginationParams } from '@/@types/api'

export type AdjustmentStatus = 'draft' | 'confirmed' | 'cancelled'

export type AdjustmentReason =
    | 'physical_count'
    | 'damaged'
    | 'theft'
    | 'expiration'
    | 'supplier_error'
    | 'correction'
    | 'other'

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
    draft: 'Borrador',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
}

export const ADJUSTMENT_STATUS_CLASSES: Record<AdjustmentStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
    confirmed:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
    physical_count: 'Conteo físico',
    damaged: 'Productos dañados',
    theft: 'Robo',
    expiration: 'Productos vencidos',
    supplier_error: 'Error del proveedor',
    correction: 'Corrección general',
    other: 'Otros',
}

export interface Adjustment {
    id: number
    warehouseId: number
    reason: AdjustmentReason
    status: AdjustmentStatus
    adjustmentDate: string | null
    notes: string | null
    adjustedBy: string | null
    createdAt: string | null
}

export interface AdjustmentInput {
    warehouseId: number
    reason: AdjustmentReason
    notes?: string | null
    adjustedBy?: string | null
}

export interface AdjustmentUpdateInput {
    notes?: string | null
    adjustedBy?: string | null
}

export interface AdjustmentItem {
    id: number
    adjustmentId: number
    productId: number
    // Only in the item list of an adjustment
    productName?: string | null
    productSku?: string | null
    locationId: number
    expectedQuantity: number
    actualQuantity: number
    difference: number
    lotId: number | null
    notes: string | null
}

export interface AdjustmentItemInput {
    productId: number
    locationId: number
    actualQuantity: number
    lotId?: number | null
    notes?: string | null
}

export interface AdjustmentItemUpdateInput {
    actualQuantity?: number | null
    notes?: string | null
}

export interface AdjustmentListParams extends PaginationParams {
    status?: AdjustmentStatus
    warehouseId?: number
}
