import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    PurchaseOrder,
    PurchaseOrderInput,
    PurchaseOrderUpdateInput,
    PurchaseOrderItem,
    PurchaseOrderItemInput,
    PurchaseOrderItemUpdateInput,
    PurchaseReceipt,
    ReceiveInput,
    PurchaseOrderQueryParams,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

interface PurchaseOrderItemsResponse {
    data: PurchaseOrderItem[]
    meta: { requestId: string; timestamp: string }
}

interface PurchaseReceiptsResponse {
    data: PurchaseReceipt[]
    meta: { requestId: string; timestamp: string }
}

// --- Purchase Orders ---

export async function getPurchaseOrders(params?: PurchaseOrderQueryParams) {
    const queryParams = new URLSearchParams()

    if (params?.status) queryParams.append('status', params.status)
    if (params?.supplierId !== undefined)
        queryParams.append('supplierId', params.supplierId.toString())
    if (params?.limit !== undefined)
        queryParams.append('limit', params.limit.toString())
    if (params?.offset !== undefined)
        queryParams.append('offset', params.offset.toString())

    const queryString = queryParams.toString()
    const url = queryString
        ? `${HOST}/purchase-orders?${queryString}`
        : `${HOST}/purchase-orders`

    return httpClient.get<PaginatedResponse<PurchaseOrder>>(url)
}

export async function getPurchaseOrder(id: number) {
    return httpClient.get<DataResponse<PurchaseOrder>>(
        `${HOST}/purchase-orders/${id}`
    )
}

export async function createPurchaseOrder(data: PurchaseOrderInput) {
    return httpClient.post<DataResponse<PurchaseOrder>>(
        `${HOST}/purchase-orders`,
        data
    )
}

export async function updatePurchaseOrder(
    id: number,
    data: PurchaseOrderUpdateInput
) {
    return httpClient.put<DataResponse<PurchaseOrder>>(
        `${HOST}/purchase-orders/${id}`,
        data
    )
}

export async function deletePurchaseOrder(id: number) {
    return httpClient.delete(`${HOST}/purchase-orders/${id}`)
}

export async function sendPurchaseOrder(id: number) {
    return httpClient.post<DataResponse<PurchaseOrder>>(
        `${HOST}/purchase-orders/${id}/send`
    )
}

export async function cancelPurchaseOrder(id: number) {
    return httpClient.post<DataResponse<PurchaseOrder>>(
        `${HOST}/purchase-orders/${id}/cancel`
    )
}

export async function receivePurchaseOrder(id: number, data: ReceiveInput) {
    return httpClient.post<DataResponse<PurchaseReceipt>>(
        `${HOST}/purchase-orders/${id}/receive`,
        data
    )
}

// --- Purchase Order Items ---

export async function getPurchaseOrderItems(orderId: number) {
    return httpClient.get<PurchaseOrderItemsResponse>(
        `${HOST}/purchase-orders/${orderId}/items`
    )
}

export async function addPurchaseOrderItem(data: PurchaseOrderItemInput) {
    return httpClient.post<DataResponse<PurchaseOrderItem>>(
        `${HOST}/purchase-order-items`,
        data
    )
}

export async function updatePurchaseOrderItem(
    itemId: number,
    data: PurchaseOrderItemUpdateInput
) {
    return httpClient.put<DataResponse<PurchaseOrderItem>>(
        `${HOST}/purchase-order-items/${itemId}`,
        data
    )
}

export async function deletePurchaseOrderItem(itemId: number) {
    return httpClient.delete(`${HOST}/purchase-order-items/${itemId}`)
}

// --- Receipts ---

export async function getPurchaseOrderReceipts(orderId: number) {
    return httpClient.get<PurchaseReceiptsResponse>(
        `${HOST}/purchase-orders/${orderId}/receipts`
    )
}
