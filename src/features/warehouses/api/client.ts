import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type { Warehouse, WarehouseListParams } from '../model/types'
import type { WarehouseFormValues } from '../model/warehouse.schema'

const HOST = appConfig.inventoryApiHost

export const getWarehouses = (params?: WarehouseListParams) =>
    httpClient.get<PaginatedResponse<Warehouse>>(`${HOST}/warehouses`, {
        params,
    })

export const getWarehouseById = (id: number) =>
    httpClient.get<DataResponse<Warehouse>>(`${HOST}/warehouses/${id}`)

export const createWarehouse = (data: WarehouseFormValues) =>
    httpClient.post<DataResponse<Warehouse>>(`${HOST}/warehouses`, data)

export const updateWarehouse = (
    id: number,
    data: Partial<WarehouseFormValues>
) => httpClient.put<DataResponse<Warehouse>>(`${HOST}/warehouses/${id}`, data)

export const deleteWarehouse = (id: number) =>
    httpClient.delete(`${HOST}/warehouses/${id}`)
