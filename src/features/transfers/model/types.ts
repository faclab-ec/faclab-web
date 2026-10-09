import type { PaginationParams } from '@/@types/api'

export type TransferStatus = 'draft' | 'confirmed' | 'received' | 'cancelled'

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
    draft: 'Borrador',
    confirmed: 'Confirmado',
    received: 'Recibido',
    cancelled: 'Cancelado',
}

export const TRANSFER_STATUS_CLASSES: Record<TransferStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
    confirmed:
        'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    received:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
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
