import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    Sale,
    SaleItem,
    SaleQueryParams,
    Payment,
    Invoice,
} from '../model/types'

const INVENTORY_HOST = appConfig.inventoryApiHost
const INVOICING_HOST = appConfig.invoicingApiHost

interface SaleItemsResponse {
    data: SaleItem[]
    meta: { requestId: string; timestamp: string }
}

interface PaymentsResponse {
    data: Payment[]
    meta: { requestId: string; timestamp: string }
}

interface InvoicesResponse {
    data: Invoice[]
    meta: { requestId: string; timestamp: string }
}

export async function getSales(params?: SaleQueryParams) {
    const queryParams = new URLSearchParams()
    if (params?.customerId !== undefined)
        queryParams.append('customerId', params.customerId.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit !== undefined)
        queryParams.append('limit', params.limit.toString())
    if (params?.offset !== undefined)
        queryParams.append('offset', params.offset.toString())

    const qs = queryParams.toString()
    const url = qs ? `${INVENTORY_HOST}/sales?${qs}` : `${INVENTORY_HOST}/sales`
    return httpClient.get<PaginatedResponse<Sale>>(url)
}

export const getSale = (id: number) =>
    httpClient.get<DataResponse<Sale>>(`${INVENTORY_HOST}/sales/${id}`)

export const getSaleItems = (saleId: number) =>
    httpClient.get<SaleItemsResponse>(`${INVENTORY_HOST}/sales/${saleId}/items`)

export const getSalePayments = (saleId: number) =>
    httpClient.get<PaymentsResponse>(
        `${INVENTORY_HOST}/sales/${saleId}/payments`
    )

export const getInvoicesBySale = (saleId: number) =>
    httpClient.get<InvoicesResponse>(
        `${INVOICING_HOST}/api/invoices/by-sale/${saleId}`
    )
