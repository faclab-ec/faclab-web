import { useState } from 'react'
import { notifyError, notifySuccess, notifyWarning } from '@shared/ui/notify'
import { useRetryInvoice } from './useInvoicing'
import { INVOICE_STATUS_LABELS, issueLabel, type Invoice } from '../model/types'

/** Retry button behavior: run the next step and say how it went */
export function useInvoiceRetryAction() {
    const retryInvoice = useRetryInvoice()
    const [retryingId, setRetryingId] = useState<string | null>(null)

    const run = async (invoice: Invoice) => {
        setRetryingId(invoice.id)
        try {
            const result = await retryInvoice.mutateAsync(invoice.id)
            if (result.issue) {
                notifyWarning(
                    'La factura sigue detenida',
                    issueLabel(result.issue.code)
                )
            } else {
                notifySuccess(
                    'Factura reintentada',
                    `Estado: ${INVOICE_STATUS_LABELS[result.status]}`
                )
            }
        } catch (error) {
            notifyError(error, 'No se pudo reintentar la factura')
        } finally {
            setRetryingId(null)
        }
    }

    return { run, retryingId }
}
