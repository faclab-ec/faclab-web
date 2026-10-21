import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { DataResponse, PaginatedResponse } from '@/@types/api'
import type {
    Certificate,
    CompanyConfig,
    CompanyConfigInput,
    Invoice,
    InvoiceQueryParams,
    InvoicingStatus,
} from '../model/types'

const HOST = appConfig.invoicingApiHost

interface CertificatesResponse {
    data: Certificate[]
    meta: { requestId: string; timestamp: string }
}

interface InvoicesResponse {
    data: Invoice[]
    meta: { requestId: string; timestamp: string }
}

export const getCertificates = () =>
    httpClient.get<CertificatesResponse>(`${HOST}/api/certificates`)

export const uploadCertificate = (file: File, password: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('password', password)
    return httpClient.post<DataResponse<Certificate>>(
        `${HOST}/api/certificates`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    )
}

export const deleteCertificate = (id: string) =>
    httpClient.delete(`${HOST}/api/certificates/${id}`)

export const getCompanyConfig = () =>
    httpClient.get<DataResponse<CompanyConfig>>(`${HOST}/api/company-config`)

export const updateCompanyConfig = (data: CompanyConfigInput) =>
    httpClient.put<DataResponse<CompanyConfig>>(
        `${HOST}/api/company-config`,
        data
    )

// Whether the issuer can invoice (config, certificate) and unfinished counts
export const getInvoicingStatus = () =>
    httpClient.get<DataResponse<InvoicingStatus>>(
        `${HOST}/api/invoicing/status`
    )

// One page of invoices, with the total in meta.pagination
export const getInvoices = (params: InvoiceQueryParams = {}) => {
    const query = new URLSearchParams()
    if (params.attention) query.append('attention', 'true')
    if (params.status) query.append('status', params.status)
    if (params.limit !== undefined) query.append('limit', String(params.limit))
    if (params.offset !== undefined)
        query.append('offset', String(params.offset))

    const qs = query.toString()
    return httpClient.get<PaginatedResponse<Invoice>>(
        qs ? `${HOST}/api/invoices?${qs}` : `${HOST}/api/invoices`
    )
}

export const getInvoicesBySale = (saleId: string | number) =>
    httpClient.get<InvoicesResponse>(`${HOST}/api/invoices/by-sale/${saleId}`)

// Runs the next step of an unfinished invoice now
export const retryInvoice = (id: string) =>
    httpClient.post<DataResponse<Invoice>>(`${HOST}/api/invoices/${id}/retry`)

// Retries every invoice that needs attention, in the background
export const retryInvoices = () =>
    httpClient.post<DataResponse<{ queued: number }>>(
        `${HOST}/api/invoices/retry`
    )
