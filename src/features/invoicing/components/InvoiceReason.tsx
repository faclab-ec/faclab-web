import { formatDatetime } from '@shared/lib/format'
import { isIssuerIssue, issueLabel, type Invoice } from '../model/types'

/**
 * Why an invoice isn't done and what happens next. The technical message from
 * faclab-invoicing shows on hover.
 */
const InvoiceReason = ({ invoice }: { invoice: Invoice }) => {
    if (invoice.issue) {
        const { code, message } = invoice.issue
        const next = isIssuerIssue(code)
            ? 'Se emite sola al completar la configuración'
            : invoice.nextAttemptAt
            ? `Próximo intento: ${formatDatetime(invoice.nextAttemptAt)}`
            : 'Sin reintentos automáticos: reinténtala a mano'
        return (
            <div className="text-sm" title={message}>
                <p className="text-amber-700 dark:text-amber-400">
                    {issueLabel(code)}
                </p>
                <p className="text-xs text-gray-500">{next}</p>
            </div>
        )
    }

    if (invoice.status === 'rejected') {
        // SRI messages of the rejection
        const last = invoice.statusHistory[invoice.statusHistory.length - 1]
        return (
            <p
                className="text-sm text-red-600 dark:text-red-400 line-clamp-2"
                title={last?.description}
            >
                {last?.description || 'Rechazada por el SRI'}
            </p>
        )
    }

    if (invoice.status === 'pending') {
        return <span className="text-sm text-gray-500">En cola</span>
    }

    return <span className="text-gray-400">-</span>
}

export default InvoiceReason
