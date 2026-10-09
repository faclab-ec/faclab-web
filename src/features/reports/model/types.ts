import type { PaginationParams } from '@/@types/api'
import type { MovementType } from '@features/movements'

export interface ValuationItem {
    productId: number
    productName: string
    sku: string
    quantity: number
    averageCost: number
    totalValue: number
}

export interface InventoryValuation {
    totalValue: number
    asOfDate: string
    items: ValuationItem[]
}

export interface ValuationParams {
    warehouseId?: number
    asOfDate?: string
}

export interface ProductRotation {
    productId: number
    productName: string
    sku: string
    totalIn: number
    totalOut: number
    currentStock: number
    turnoverRate: number
    daysOfStock: number | null
}

export interface RotationParams {
    fromDate?: string
    toDate?: string
    warehouseId?: number
}

export interface MovementHistoryItem {
    id: number
    productId: number
    productName: string
    sku: string
    quantity: number
    type: MovementType
    locationId: number | null
    sourceLocationId: number | null
    referenceType: string | null
    referenceId: number | null
    reason: string | null
    date: string | null
    createdAt: string | null
}

export interface MovementHistoryParams extends PaginationParams {
    productId?: number
    type?: MovementType
    fromDate?: string
    toDate?: string
    warehouseId?: number
}

export interface WarehouseSummary {
    warehouseId: number
    warehouseName: string
    warehouseCode: string
    totalProducts: number
    totalQuantity: number
    reservedQuantity: number
    availableQuantity: number
    totalValue: number
}

export interface SummaryParams {
    warehouseId?: number
}

// Home page summary (GET /dashboard)
export interface Dashboard {
    inventoryValue: number
    warehouses: WarehouseSummary[]
    alerts: {
        lowStock: number
        outOfStock: number
        reorderPoint: number
        expiringSoon: number
    }
}
