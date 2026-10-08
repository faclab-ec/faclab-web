import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type { Location, LocationListParams, LocationType } from '../model/types'
import type { LocationFormValues } from '../model/location.schema'

const HOST = appConfig.inventoryApiHost

export type LocationInput = {
    warehouseId: number
    name: string
    code: string
    type: LocationType
    isActive?: boolean
    capacity?: number | null
}

export const getLocations = (params?: LocationListParams) =>
    httpClient.get<PaginatedResponse<Location>>(`${HOST}/locations`, { params })

export const getLocationById = (id: number) =>
    httpClient.get<DataResponse<Location>>(`${HOST}/locations/${id}`)

export const createLocation = (data: LocationFormValues) =>
    httpClient.post<DataResponse<Location>>(`${HOST}/locations`, data)

export const updateLocation = (id: number, data: Partial<LocationFormValues>) =>
    httpClient.put<DataResponse<Location>>(`${HOST}/locations/${id}`, data)

export const deleteLocation = (id: number) =>
    httpClient.delete(`${HOST}/locations/${id}`)
