import type { PaginationParams } from '@/@types/api'
import type { StatusTone } from '@shared/lib/statusTone'

export type TransferStatus = 'draft' | 'confirmed' | 'received' | 'cancelled'

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
    draft: 'Borrador',
    confirmed: 'Confirmado',
    received: 'Recibido',
    cancelled: 'Cancelado',
}

export const TRANSFER_STATUS_TONES: Record<TransferStatus, StatusTone> = {
    draft: 'neutral',
    confirmed: 'info',
    received: 'success',
    cancelled: 'danger',
}

export interface Transfer {
    id: number
    sourceLocationId: number
    destinationLocationId: number
    status: TransferStatus
    transferDate: string | null
    requestedBy: string | null
    notes: string | null
    createdAt: string | null
}

export interface TransferInput {
    sourceLocationId: number
    destinationLocationId: number
    notes?: string | null
    requestedBy?: string | null
}

export interface TransferUpdateInput {
    notes?: string | null
    requestedBy?: string | null
}

export interface TransferItem {
    id: number
    transferId: number
    productId: number
    // Only in the item list of a transfer
    productName?: string | null
    productSku?: string | null
    quantity: number
    lotId: number | null
    notes: string | null
}

export interface TransferItemInput {
    productId: number
    quantity: number
    lotId?: number | null
    notes?: string | null
}

export interface TransferItemUpdateInput {
    quantity?: number | null
    notes?: string | null
}

export interface TransferListParams extends PaginationParams {
    status?: TransferStatus
    sourceLocationId?: number
}
