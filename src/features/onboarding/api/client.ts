import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { DataResponse } from '@/@types/api'
import type { CompanyConfig } from '@features/invoicing'
import type { CoreChecklist, TestInvoice } from '../model/types'

const CORE = `${appConfig.inventoryApiHost}/onboarding`
const INVOICING = appConfig.invoicingApiHost

export const getChecklist = () =>
    httpClient.get<DataResponse<CoreChecklist>>(CORE)

export const getTestInvoice = () =>
    httpClient.get<DataResponse<TestInvoice>>(
        `${INVOICING}/api/invoicing/test-invoice`
    )

export const submitTestInvoice = (point?: {
    establishment: string
    emissionPoint: string
}) =>
    httpClient.post<DataResponse<TestInvoice>>(
        `${INVOICING}/api/invoicing/test-invoice`,
        point ?? {}
    )

/** Pasa la empresa al ambiente de producción del SRI (S8.5) */
export const goLive = (confirmRuc: string) =>
    httpClient.post<DataResponse<CompanyConfig>>(
        `${INVOICING}/api/company-config/go-live`,
        { confirmRuc, acknowledge: true }
    )
