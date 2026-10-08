import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    UnitOfMeasure,
    UnitOfMeasureInput,
    UnitOfMeasureListParams,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

export const getUnitsOfMeasure = (params?: UnitOfMeasureListParams) =>
    httpClient.get<PaginatedResponse<UnitOfMeasure>>(
        `${HOST}/units-of-measure`,
        { params }
    )

export const getUnitOfMeasureById = (id: number) =>
    httpClient.get<DataResponse<UnitOfMeasure>>(
        `${HOST}/units-of-measure/${id}`
    )

export const createUnitOfMeasure = (data: UnitOfMeasureInput) =>
    httpClient.post<DataResponse<UnitOfMeasure>>(
        `${HOST}/units-of-measure`,
        data
    )

export const updateUnitOfMeasure = (
    id: number,
    data: Partial<UnitOfMeasureInput>
) =>
    httpClient.put<DataResponse<UnitOfMeasure>>(
        `${HOST}/units-of-measure/${id}`,
        data
    )

export const deleteUnitOfMeasure = (id: number) =>
    httpClient.delete(`${HOST}/units-of-measure/${id}`)
