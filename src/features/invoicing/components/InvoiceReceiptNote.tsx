import { useInvoicingStatus } from '../hooks/useInvoicing'

/**
 * Tells the cashier, after a sale, whether its electronic invoice goes out now
 * or waits for the fiscal config. Not printed: it's about the system, not the
 * customer's receipt.
 */
const InvoiceReceiptNote = () => {
    const { data: status } = useInvoicingStatus()
    if (!status) return null

    if (!status.ready) {
        return (
            <p className="print:hidden text-xs text-center rounded-md p-2 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Factura electrónica pendiente: se emitirá cuando se complete la
                configuración de facturación
            </p>
        )
    }

    return (
        <p className="print:hidden text-xs text-center text-gray-500 dark:text-gray-400">
            La factura electrónica se envía al SRI en unos momentos
        </p>
    )
}

export default InvoiceReceiptNote
