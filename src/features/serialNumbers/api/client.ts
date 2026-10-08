import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    SerialNumber,
    SerialNumberInput,
    SerialNumberListParams,
    SerialStatus,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

export const getSerialNumbers = (params?: SerialNumberListParams) =>
    httpClient.get<PaginatedResponse<SerialNumber>>(`${HOST}/serials`, {
        params,
    })

export const getSerialNumber = (id: number) =>
    httpClient.get<DataResponse<SerialNumber>>(`${HOST}/serials/${id}`)

export const createSerialNumber = (data: SerialNumberInput) =>
    httpClient.post<DataResponse<SerialNumber>>(`${HOST}/serials`, data)

export const changeStatus = (id: number, status: SerialStatus) =>
    httpClient.put<DataResponse<SerialNumber>>(`${HOST}/serials/${id}/status`, {
        status,
    })
