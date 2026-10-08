import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { DataResponse } from '@/@types/api'
import type {
    Certificate,
    CompanyConfig,
    CompanyConfigInput,
    Invoice,
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

export const getInvoicesBySale = (saleId: string | number) =>
    httpClient.get<InvoicesResponse>(`${HOST}/api/invoices/by-sale/${saleId}`)
