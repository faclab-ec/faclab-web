import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    Lot,
    LotInput,
    LotUpdateInput,
    LotListParams,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

export const getLots = (params?: LotListParams) =>
    httpClient.get<PaginatedResponse<Lot>>(`${HOST}/lots`, { params })

export const getLot = (id: number) =>
    httpClient.get<DataResponse<Lot>>(`${HOST}/lots/${id}`)

export const createLot = (data: LotInput) =>
    httpClient.post<DataResponse<Lot>>(`${HOST}/lots`, data)

export const updateLot = (id: number, data: LotUpdateInput) =>
    httpClient.put<DataResponse<Lot>>(`${HOST}/lots/${id}`, data)
