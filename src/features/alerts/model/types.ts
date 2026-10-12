import type { StatusTone } from '@shared/lib/statusTone'

export type AlertType =
    | 'low_stock'
    | 'out_of_stock'
    | 'reorder_point'
    | 'expiring_soon'

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
    low_stock: 'Stock Bajo',
    out_of_stock: 'Sin Stock',
    reorder_point: 'Punto de Reorden',
    expiring_soon: 'Por Vencer',
}

export const ALERT_TYPE_TONES: Record<AlertType, StatusTone> = {
    low_stock: 'warning',
    out_of_stock: 'danger',
    reorder_point: 'info',
    expiring_soon: 'warning',
}

export interface StockAlert {
    type: AlertType
    productId: number
    productName: string
    sku: string
    currentQuantity: number
    threshold: number
    warehouseId: number | null
    lotId: number | null
    daysToExpiry: number | null
}

export interface StockAlertParams {
    warehouseId?: number
}

export interface ExpiringLotsParams {
    days?: number
}
