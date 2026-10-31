import { useState } from 'react'
import { saveFile } from '@shared/lib/saveFile'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import * as api from '../api/client'
import { INVOICING_ERROR_MESSAGES } from '../model/errors'
import type { Invoice } from '../model/types'
import { useResendInvoiceEmail } from './useInvoicing'

export type InvoiceDocument = 'ride' | 'xml'

const DOCUMENTS: Record<
    InvoiceDocument,
    { extension: string; fetch: (id: string) => Promise<Blob>; error: string }
> = {
    ride: {
        extension: 'pdf',
        fetch: api.downloadRide,
        error: 'No se pudo descargar el RIDE',
    },
    xml: {
        extension: 'xml',
        fetch: api.downloadAuthorizedXml,
        error: 'No se pudo descargar el XML',
    },
}

/**
 * Descarga del XML autorizado y del RIDE, y reenvío al comprador. El nombre
 * del archivo es la clave de acceso, como lo nombra faclab-invoicing (su
 * `Content-Disposition` no llega al navegador por CORS).
 */
export function useInvoiceDocuments() {
    const resend = useResendInvoiceEmail()
    const [busy, setBusy] = useState<string | null>(null)

    const download = async (invoice: Invoice, document: InvoiceDocument) => {
        const { extension, fetch, error } = DOCUMENTS[document]
        setBusy(`${invoice.id}:${document}`)
        try {
            const blob = await fetch(invoice.id)
            saveFile(blob, `${invoice.accessCode ?? invoice.id}.${extension}`)
        } catch (err) {
            notifyError(err, error, { messages: INVOICING_ERROR_MESSAGES })
        } finally {
            setBusy(null)
        }
    }

    const sendAgain = async (invoice: Invoice) => {
        setBusy(`${invoice.id}:email`)
        try {
            const delivery = await resend.mutateAsync(invoice.id)
            notifySuccess(
                'Envío en curso',
                `La factura se enviará a ${
                    delivery.recipient ?? invoice.buyerEmail
                }.`
            )
        } catch (err) {
            notifyError(err, 'No se pudo reenviar la factura', {
                messages: INVOICING_ERROR_MESSAGES,
            })
        } finally {
            setBusy(null)
        }
    }

    const isBusy = (invoice: Invoice, action: InvoiceDocument | 'email') =>
        busy === `${invoice.id}:${action}`

    return { download, sendAgain, isBusy }
}
