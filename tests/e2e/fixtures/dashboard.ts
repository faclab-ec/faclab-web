import type {
    Dashboard,
    InventoryValuation,
} from '@/features/reports/model/types'
import type { DailyReport } from '@/features/pos/model/types'

export const dashboard = (overrides: Partial<Dashboard> = {}): Dashboard => ({
    inventoryValue: 48250.75,
    warehouses: [
        {
            warehouseId: 1,
            warehouseName: 'Bodega Central',
            warehouseCode: 'BOD-01',
            totalProducts: 84,
            totalQuantity: 2140,
            reservedQuantity: 120,
            availableQuantity: 2020,
            totalValue: 31800.5,
        },
        {
            warehouseId: 2,
            warehouseName: 'Local Norte',
            warehouseCode: 'LOC-02',
            totalProducts: 37,
            totalQuantity: 760,
            reservedQuantity: 15,
            availableQuantity: 745,
            totalValue: 16450.25,
        },
    ],
    alerts: { lowStock: 4, outOfStock: 1, reorderPoint: 6, expiringSoon: 2 },
    uninvoicedSales: 0,
    ...overrides,
})

export const emptyDashboard = (): Dashboard =>
    dashboard({
        inventoryValue: 0,
        warehouses: [],
        alerts: {
            lowStock: 0,
            outOfStock: 0,
            reorderPoint: 0,
            expiringSoon: 0,
        },
    })

export const emptyValuation = (): InventoryValuation => ({
    totalValue: 0,
    asOfDate: '2026-01-15',
    items: [],
})

export const emptyDailyReport = (): DailyReport => ({
    date: '2026-01-15',
    totalSales: 0,
    totalAmount: 0,
    paymentsByMethod: [],
    topProducts: [],
    refundSummary: { count: 0, total: 0 },
})
