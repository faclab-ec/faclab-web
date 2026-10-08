import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    Adjustment,
    AdjustmentInput,
    AdjustmentUpdateInput,
    AdjustmentItem,
    AdjustmentItemInput,
    AdjustmentItemUpdateInput,
    AdjustmentListParams,
} from '../model/types'

interface AdjustmentItemsResponse {
    data: AdjustmentItem[]
    meta: { requestId: string; timestamp: string }
}

const HOST = appConfig.inventoryApiHost

export async function getAdjustments(params?: AdjustmentListParams) {
    const queryParams = new URLSearchParams()

    if (params?.status) queryParams.append('status', params.status)
    if (params?.warehouseId !== undefined) {
        queryParams.append('warehouseId', params.warehouseId.toString())
    }
    if (params?.limit !== undefined) {
        queryParams.append('limit', params.limit.toString())
    }
    if (params?.offset !== undefined) {
        queryParams.append('offset', params.offset.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString
        ? `${HOST}/adjustments?${queryString}`
        : `${HOST}/adjustments`

    return httpClient.get<PaginatedResponse<Adjustment>>(url)
}

export async function getAdjustment(id: number) {
    return httpClient.get<DataResponse<Adjustment>>(`${HOST}/adjustments/${id}`)
}

export async function createAdjustment(data: AdjustmentInput) {
    return httpClient.post<DataResponse<Adjustment>>(
        `${HOST}/adjustments`,
        data
    )
}

export async function updateAdjustment(
    id: number,
    data: AdjustmentUpdateInput
) {
    return httpClient.put<DataResponse<Adjustment>>(
        `${HOST}/adjustments/${id}`,
        data
    )
}

export async function deleteAdjustment(id: number) {
    return httpClient.delete(`${HOST}/adjustments/${id}`)
}

export async function confirmAdjustment(id: number) {
    return httpClient.post<DataResponse<Adjustment>>(
        `${HOST}/adjustments/${id}/confirm`
    )
}

export async function cancelAdjustment(id: number) {
    return httpClient.post<DataResponse<Adjustment>>(
        `${HOST}/adjustments/${id}/cancel`
    )
}

export async function getAdjustmentItems(adjustmentId: number) {
    return httpClient.get<AdjustmentItemsResponse>(
        `${HOST}/adjustments/${adjustmentId}/items`
    )
}

export async function addAdjustmentItem(
    adjustmentId: number,
    data: AdjustmentItemInput
) {
    return httpClient.post<DataResponse<AdjustmentItem>>(
        `${HOST}/adjustments/${adjustmentId}/items`,
        data
    )
}

export async function updateAdjustmentItem(
    itemId: number,
    data: AdjustmentItemUpdateInput
) {
    return httpClient.put<DataResponse<AdjustmentItem>>(
        `${HOST}/adjustment-items/${itemId}`,
        data
    )
}

export async function deleteAdjustmentItem(itemId: number) {
    return httpClient.delete(`${HOST}/adjustment-items/${itemId}`)
}
