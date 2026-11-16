import type { PaginationParams } from '@/@types/api'
import type { StatusTone } from '@shared/lib/statusTone'

export type AdjustmentStatus = 'draft' | 'confirmed' | 'cancelled'

export type AdjustmentReason =
    | 'physical_count'
    | 'damaged'
    | 'theft'
    | 'expiration'
    | 'supplier_error'
    | 'correction'
    | 'other'
    | 'initial_balance'

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
    draft: 'Borrador',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
}

export const ADJUSTMENT_STATUS_TONES: Record<AdjustmentStatus, StatusTone> = {
    draft: 'neutral',
    confirmed: 'success',
    cancelled: 'danger',
}

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
    physical_count: 'Conteo físico',
    damaged: 'Productos dañados',
    theft: 'Robo',
    expiration: 'Productos vencidos',
    supplier_error: 'Error del proveedor',
    correction: 'Corrección general',
    other: 'Otros',
    initial_balance: 'Saldo inicial',
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
}

export interface AdjustmentUpdateInput {
    notes?: string | null
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
    // Per base unit, for what the count adds over the system, e.g. an initial
    // balance (S5.6); without it those units enter at the average cost
    unitCost?: number | null
}

export interface AdjustmentItemInput {
    productId: number
    locationId: number
    actualQuantity: number
    lotId?: number | null
    notes?: string | null
    unitCost?: number | null
}

export interface AdjustmentItemUpdateInput {
    actualQuantity?: number | null
    notes?: string | null
    unitCost?: number | null
}

export interface AdjustmentListParams extends PaginationParams {
    status?: AdjustmentStatus
    warehouseId?: number
}
