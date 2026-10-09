import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { DataResponse, PaginatedResponse } from '@/@types/api'
import type {
    Shift,
    OpenShiftInput,
    CloseShiftInput,
    CashMovement,
    CashMovementInput,
    ListResponse,
    POSSale,
    POSSaleItem,
    POSPayment,
    CreateSaleInput,
    QuickSaleInput,
    AddSaleItemInput,
    UpdateSaleItemInput,
    SaleDiscountInput,
    PriceOverrideInput,
    PaymentInput,
    Receipt,
    Refund,
    RefundListParams,
    CreateRefundInput,
    ProcessRefundInput,
    XReport,
    ZReport,
    DailyReport,
    PaymentMethodSummary,
    ShiftListParams,
    CashSummary,
    POSProduct,
    POSCustomer,
    QuickCustomerInput,
} from '../model/types'

const HOST = appConfig.posApiHost

// === SHIFTS ===

export const getActiveShift = () =>
    httpClient.get<DataResponse<Shift | null>>(`${HOST}/shifts/active`)

export const openShift = (data: OpenShiftInput) =>
    httpClient.post<DataResponse<Shift>>(`${HOST}/shifts/open`, data)

export const closeShift = (shiftId: number, data: CloseShiftInput) =>
    httpClient.post<DataResponse<Shift>>(
        `${HOST}/shifts/${shiftId}/close`,
        data
    )

export const getShift = (id: number) =>
    httpClient.get<DataResponse<Shift>>(`${HOST}/shifts/${id}`)

export const getShifts = (params?: ShiftListParams) =>
    httpClient.get<PaginatedResponse<Shift>>(`${HOST}/shifts`, { params })

export const addCashMovement = (shiftId: number, data: CashMovementInput) =>
    httpClient.post<DataResponse<CashMovement>>(
        `${HOST}/shifts/${shiftId}/cash-movements`,
        data
    )

export const getCashMovements = (shiftId: number) =>
    httpClient.get<ListResponse<CashMovement>>(
        `${HOST}/shifts/${shiftId}/cash-movements`
    )

// === SALES ===

export const createSale = (data: CreateSaleInput) =>
    httpClient.post<DataResponse<POSSale>>(`${HOST}/sales`, data)

export const quickSale = (data: QuickSaleInput) =>
    httpClient.post<DataResponse<POSSale>>(`${HOST}/sales/quick`, data)

export const getSale = (id: number) =>
    httpClient.get<DataResponse<POSSale>>(`${HOST}/sales/${id}`)

export const addSaleItem = (saleId: number, data: AddSaleItemInput) =>
    httpClient.post<DataResponse<POSSaleItem>>(
        `${HOST}/sales/${saleId}/items`,
        data
    )

export const getSaleItems = (saleId: number) =>
    httpClient.get<ListResponse<POSSaleItem>>(`${HOST}/sales/${saleId}/items`)

export const updateSaleItem = (
    saleId: number,
    itemId: number,
    data: UpdateSaleItemInput
) =>
    httpClient.put<DataResponse<POSSaleItem>>(
        `${HOST}/sales/${saleId}/items/${itemId}`,
        data
    )

export const deleteSaleItem = (saleId: number, itemId: number) =>
    httpClient.delete<void>(`${HOST}/sales/${saleId}/items/${itemId}`)

export const confirmSale = (saleId: number) =>
    httpClient.post<DataResponse<POSSale>>(
        `${HOST}/sales/${saleId}/confirm`,
        undefined
    )

export const cancelSale = (saleId: number, reason?: string) =>
    httpClient.post<DataResponse<POSSale>>(
        `${HOST}/sales/${saleId}/cancel`,
        reason ? { reason } : undefined
    )

export const parkSale = (saleId: number, reason?: string) =>
    httpClient.post<DataResponse<POSSale>>(
        `${HOST}/sales/${saleId}/park`,
        reason ? { reason } : undefined
    )

export const resumeSale = (saleId: number) =>
    httpClient.post<DataResponse<POSSale>>(
        `${HOST}/sales/${saleId}/resume`,
        undefined
    )

export const getParkedSales = () =>
    httpClient.get<ListResponse<POSSale>>(`${HOST}/sales/parked`)

export const applySaleDiscount = (saleId: number, data: SaleDiscountInput) =>
    httpClient.post<DataResponse<POSSale>>(
        `${HOST}/sales/${saleId}/discount`,
        data
    )

export const addPayment = (saleId: number, data: PaymentInput) =>
    httpClient.post<DataResponse<POSPayment>>(
        `${HOST}/sales/${saleId}/payments`,
        data
    )

export const getSalePayments = (saleId: number) =>
    httpClient.get<ListResponse<POSPayment>>(`${HOST}/sales/${saleId}/payments`)

export const overrideItemPrice = (
    saleId: number,
    itemId: number,
    data: PriceOverrideInput
) =>
    httpClient.put<DataResponse<POSSaleItem>>(
        `${HOST}/sales/${saleId}/items/${itemId}/price`,
        data
    )

export const getReceipt = (saleId: number) =>
    httpClient.get<DataResponse<Receipt>>(`${HOST}/sales/${saleId}/receipt`)

// === REFUNDS ===

export const createRefund = (data: CreateRefundInput) =>
    httpClient.post<DataResponse<Refund>>(`${HOST}/refunds`, data)

export const processRefund = (refundId: number, data: ProcessRefundInput) =>
    httpClient.post<DataResponse<Refund>>(
        `${HOST}/refunds/${refundId}/process`,
        data
    )

export const cancelRefund = (refundId: number) =>
    httpClient.post<DataResponse<Refund>>(
        `${HOST}/refunds/${refundId}/cancel`,
        undefined
    )

export const getRefund = (id: number) =>
    httpClient.get<DataResponse<Refund>>(`${HOST}/refunds/${id}`)

export const getRefunds = (params?: RefundListParams) =>
    httpClient.get<PaginatedResponse<Refund>>(`${HOST}/refunds`, { params })

// === REPORTS ===

export const getCashSummary = (shiftId: number) =>
    httpClient.get<DataResponse<CashSummary>>(
        `${HOST}/shifts/${shiftId}/cash-summary`
    )

export const getXReport = (shiftId: number) =>
    httpClient.get<DataResponse<XReport>>(`${HOST}/reports/x-report`, {
        params: { shiftId },
    })

export const getZReport = (shiftId: number) =>
    httpClient.get<DataResponse<ZReport>>(`${HOST}/reports/z-report`, {
        params: { shiftId },
    })

export const getDailyReport = (date: string) =>
    httpClient.get<DataResponse<DailyReport>>(`${HOST}/reports/daily`, {
        params: { date },
    })

export const getByPaymentMethod = (fromDate: string, toDate: string) =>
    httpClient.get<DataResponse<PaymentMethodSummary[]>>(
        `${HOST}/reports/by-payment-method`,
        { params: { fromDate, toDate } }
    )

// === PRODUCTS ===

export const getProducts = () =>
    httpClient.get<ListResponse<POSProduct>>(`${HOST}/products`)

export const searchProducts = (term: string, limit?: number) =>
    httpClient.get<ListResponse<POSProduct>>(`${HOST}/products/search`, {
        params: { term, limit },
    })

export const getProduct = (id: number) =>
    httpClient.get<DataResponse<POSProduct>>(`${HOST}/products/${id}`)

// === CUSTOMERS ===

export const getCustomers = () =>
    httpClient.get<ListResponse<POSCustomer>>(`${HOST}/customers`)

export const searchCustomerByTaxId = (taxId: string) =>
    httpClient.get<DataResponse<POSCustomer>>(
        `${HOST}/customers/search/by-tax-id`,
        { params: { taxId } }
    )

export const quickCreateCustomer = (data: QuickCustomerInput) =>
    httpClient.post<DataResponse<POSCustomer>>(`${HOST}/customers`, data)

export const getCustomer = (id: number) =>
    httpClient.get<DataResponse<POSCustomer>>(`${HOST}/customers/${id}`)
