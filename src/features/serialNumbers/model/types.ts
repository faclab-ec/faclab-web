import type { PaginationParams } from '@/@types/api'
import type { StatusTone } from '@shared/lib/statusTone'

export type SerialStatus =
    | 'available'
    | 'reserved'
    | 'sold'
    | 'returned'
    | 'scrapped'

export const SERIAL_STATUS_LABELS: Record<SerialStatus, string> = {
    available: 'Disponible',
    reserved: 'Reservado',
    sold: 'Vendido',
    returned: 'Devuelto',
    scrapped: 'Descartado',
}

export const SERIAL_STATUS_TONES: Record<SerialStatus, StatusTone> = {
    available: 'success',
    reserved: 'warning',
    sold: 'info',
    returned: 'warning',
    scrapped: 'danger',
}

export const VALID_TRANSITIONS: Record<SerialStatus, SerialStatus[]> = {
    available: ['reserved', 'sold', 'scrapped'],
    reserved: ['scrapped'],
    sold: ['returned', 'scrapped'],
    returned: ['scrapped'],
    scrapped: [],
}

export type SerialNumber = {
    id: number
    serialNumber: string
    productId: number
    status: SerialStatus
    lotId?: number | null
    locationId?: number | null
    purchaseOrderId?: number | null
    saleId?: number | null
    notes?: string | null
    createdAt: string
    updatedAt: string
}

export type SerialNumberInput = {
    serialNumber: string
    productId: number
    lotId?: number
    notes?: string
}

export type SerialNumberListParams = PaginationParams & {
    productId?: number
    status?: SerialStatus
}
