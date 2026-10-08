import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    Transfer,
    TransferInput,
    TransferUpdateInput,
    TransferItem,
    TransferItemInput,
    TransferItemUpdateInput,
    TransferListParams,
} from '../model/types'

interface TransferItemsResponse {
    data: TransferItem[]
    meta: { requestId: string; timestamp: string }
}

const HOST = appConfig.inventoryApiHost

export async function getTransfers(params?: TransferListParams) {
    const queryParams = new URLSearchParams()

    if (params?.status) queryParams.append('status', params.status)
    if (params?.sourceLocationId !== undefined) {
        queryParams.append(
            'sourceLocationId',
            params.sourceLocationId.toString()
        )
    }
    if (params?.limit !== undefined) {
        queryParams.append('limit', params.limit.toString())
    }
    if (params?.offset !== undefined) {
        queryParams.append('offset', params.offset.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString
        ? `${HOST}/transfers?${queryString}`
        : `${HOST}/transfers`

    return httpClient.get<PaginatedResponse<Transfer>>(url)
}

export async function getTransfer(id: number) {
    return httpClient.get<DataResponse<Transfer>>(`${HOST}/transfers/${id}`)
}

export async function createTransfer(data: TransferInput) {
    return httpClient.post<DataResponse<Transfer>>(`${HOST}/transfers`, data)
}

export async function updateTransfer(id: number, data: TransferUpdateInput) {
    return httpClient.put<DataResponse<Transfer>>(
        `${HOST}/transfers/${id}`,
        data
    )
}

export async function deleteTransfer(id: number) {
    return httpClient.delete(`${HOST}/transfers/${id}`)
}

export async function confirmTransfer(id: number) {
    return httpClient.post<DataResponse<Transfer>>(
        `${HOST}/transfers/${id}/confirm`
    )
}

export async function receiveTransfer(id: number) {
    return httpClient.post<DataResponse<Transfer>>(
        `${HOST}/transfers/${id}/receive`
    )
}

export async function cancelTransfer(id: number) {
    return httpClient.post<DataResponse<Transfer>>(
        `${HOST}/transfers/${id}/cancel`
    )
}

export async function getTransferItems(transferId: number) {
    return httpClient.get<TransferItemsResponse>(
        `${HOST}/transfers/${transferId}/items`
    )
}

export async function addTransferItem(
    transferId: number,
    data: TransferItemInput
) {
    return httpClient.post<DataResponse<TransferItem>>(
        `${HOST}/transfers/${transferId}/items`,
        data
    )
}

export async function updateTransferItem(
    itemId: number,
    data: TransferItemUpdateInput
) {
    return httpClient.put<DataResponse<TransferItem>>(
        `${HOST}/transfer-items/${itemId}`,
        data
    )
}

export async function deleteTransferItem(itemId: number) {
    return httpClient.delete(`${HOST}/transfer-items/${itemId}`)
}
