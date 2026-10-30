import StatusBadge from '@/components/shared/StatusBadge'
import {
    INVOICE_STATUS_LABELS,
    INVOICE_STATUS_TONES,
    InvoiceReason,
    useInvoicesBySale,
} from '@features/invoicing'
import { latestInvoice } from '../model/discrepancies'

/** Lo que faclab-invoicing tiene de la venta: su factura más reciente y por qué
 * no termina, o que nunca la recibió */
const DiscrepancyInvoicing = ({ saleId }: { saleId: number }) => {
    const { data: invoices, isLoading, isError } = useInvoicesBySale(saleId)

    if (isLoading) {
        return <span className="text-sm text-gray-500">Consultando...</span>
    }
    if (isError || !invoices) {
        return (
            <span className="text-sm text-gray-500">
                Facturación no responde
            </span>
        )
    }
    const latest = latestInvoice(invoices)
    if (!latest) {
        return (
            <span className="text-sm text-amber-700 dark:text-amber-400">
                No recibió la venta
            </span>
        )
    }
    return (
        <div className="flex flex-col items-start gap-1">
            <StatusBadge tone={INVOICE_STATUS_TONES[latest.status]}>
                {INVOICE_STATUS_LABELS[latest.status]}
            </StatusBadge>
            <InvoiceReason invoice={latest} />
        </div>
    )
}

export default DiscrepancyInvoicing
