export type {
    Sale,
    SaleItem,
    Payment,
    SaleStatus,
    PaymentStatus,
    PaymentMethod,
    SaleQueryParams,
    SaleInvoiceStatus,
    InvoiceDiscrepancy,
    DiscrepancyKind,
    DiscrepancyStatus,
} from './model/types'

export {
    SALE_STATUS_LABELS,
    SALE_STATUS_TONES,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_TONES,
    PAYMENT_METHOD_LABELS,
    SALE_INVOICE_STATUS_LABELS,
    SALE_INVOICE_STATUS_TONES,
    DISCREPANCY_KIND_LABELS,
    DISCREPANCY_STATUS_LABELS,
} from './model/types'

export {
    useSalesList,
    useSale,
    useSaleItems,
    useSalePayments,
    useRequestInvoice,
    useInvoiceDiscrepancies,
    useReviewDiscrepancy,
} from './hooks/useSales'

export { salesRoutes } from './routes'
