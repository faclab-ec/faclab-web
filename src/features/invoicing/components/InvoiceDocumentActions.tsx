import { useState, type MouseEvent } from 'react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
    HiOutlineCode,
    HiOutlineDocumentDownload,
    HiOutlineMail,
} from 'react-icons/hi'
import { useCan } from '@/stores'
import { useInvoiceDocuments } from '../hooks/useInvoiceDocuments'
import { hasDocuments, type Invoice } from '../model/types'

interface InvoiceDocumentActionsProps {
    invoice: Invoice
}

// Las filas que los muestran se abren al hacer clic: el botón no
const only =
    (action: () => void) =>
    (event: MouseEvent): void => {
        event.stopPropagation()
        action()
    }

/**
 * RIDE y XML de una factura autorizada, y su reenvío al correo del comprador
 * (siempre el de la venta). Nada mientras no esté autorizada.
 */
const InvoiceDocumentActions = ({ invoice }: InvoiceDocumentActionsProps) => {
    const canSend = useCan('sale:write')
    const documents = useInvoiceDocuments()
    const [confirming, setConfirming] = useState(false)

    if (!hasDocuments(invoice)) return null

    return (
        <div className="flex gap-1">
            <Button
                aria-label="Descargar RIDE"
                icon={<HiOutlineDocumentDownload />}
                loading={documents.isBusy(invoice, 'ride')}
                size="sm"
                title="Descargar RIDE (PDF)"
                variant="plain"
                onClick={only(() => documents.download(invoice, 'ride'))}
            />
            <Button
                aria-label="Descargar XML"
                icon={<HiOutlineCode />}
                loading={documents.isBusy(invoice, 'xml')}
                size="sm"
                title="Descargar XML autorizado"
                variant="plain"
                onClick={only(() => documents.download(invoice, 'xml'))}
            />
            {canSend && (
                <Button
                    aria-label="Reenviar por correo"
                    disabled={!invoice.buyerEmail}
                    icon={<HiOutlineMail />}
                    loading={documents.isBusy(invoice, 'email')}
                    size="sm"
                    title={
                        invoice.buyerEmail
                            ? `Reenviar a ${invoice.buyerEmail}`
                            : 'El comprador no tiene correo'
                    }
                    variant="plain"
                    onClick={only(() => setConfirming(true))}
                />
            )}
            <ConfirmDialog
                isOpen={confirming}
                title="Reenviar la factura"
                confirmText="Reenviar"
                onCancel={() => setConfirming(false)}
                onClose={() => setConfirming(false)}
                onConfirm={() => {
                    setConfirming(false)
                    documents.sendAgain(invoice)
                }}
            >
                <p>
                    Se enviarán el RIDE y el XML autorizado a{' '}
                    <strong>{invoice.buyerEmail}</strong>, el correo del
                    comprador registrado en la venta.
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default InvoiceDocumentActions
