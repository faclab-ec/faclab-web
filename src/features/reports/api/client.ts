import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { DataResponse, PaginatedResponse } from '@/@types/api'
import type {
    InventoryValuation,
    ValuationParams,
    ProductRotation,
    RotationParams,
    MovementHistoryItem,
    MovementHistoryParams,
    WarehouseSummary,
    SummaryParams,
    Dashboard,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

export const getValuation = (params?: ValuationParams) =>
    httpClient.get<DataResponse<InventoryValuation>>(
        `${HOST}/reports/inventory/valuation`,
        { params }
    )

export const getRotation = (params?: RotationParams) =>
    httpClient.get<DataResponse<ProductRotation[]>>(
        `${HOST}/reports/inventory/rotation`,
        { params }
    )

export const getMovementHistory = (params?: MovementHistoryParams) =>
    httpClient.get<PaginatedResponse<MovementHistoryItem>>(
        `${HOST}/reports/inventory/movements`,
        { params }
    )

export const getWarehouseSummary = (params?: SummaryParams) =>
    httpClient.get<DataResponse<WarehouseSummary[]>>(
        `${HOST}/reports/inventory/summary`,
        { params }
    )

export const getDashboard = (expiringDays = 30) =>
    httpClient.get<DataResponse<Dashboard>>(`${HOST}/dashboard`, {
        params: { expiringDays },
    })
