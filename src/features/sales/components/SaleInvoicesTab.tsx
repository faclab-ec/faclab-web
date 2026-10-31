import { useState } from 'react'
import Table from '@/components/ui/Table'
import StatusBadge from '@/components/shared/StatusBadge'
import Button from '@/components/ui/Button'
import { HiOutlineRefresh } from 'react-icons/hi'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useCan } from '@/stores'
import {
    INVOICE_STATUS_TONES,
    INVOICE_STATUS_LABELS,
    InvoiceDocumentActions,
    InvoiceReason,
    invoiceNumber,
    isFinalInvoice,
    useInvoiceRetryAction,
    useInvoicesBySale,
    type Invoice,
} from '@features/invoicing'
import { useRequestInvoice } from '../hooks/useSales'
import type { SaleInvoiceStatus, SaleStatus } from '../model/types'
import InvoicePreviewDialog from './InvoicePreviewDialog'
import EmptyState from '@/components/shared/EmptyState'

const { Tr, Th, Td, THead, TBody } = Table

interface SaleInvoicesTabProps {
    saleId: number
    saleStatus: SaleStatus
    invoiceStatus?: SaleInvoiceStatus | null
}

const SaleInvoicesTab = ({
    saleId,
    saleStatus,
    invoiceStatus,
}: SaleInvoicesTabProps) => {
    const {
        data: invoices = [],
        isLoading,
        isError,
    } = useInvoicesBySale(saleId)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const canWrite = useCan('sale:write')
    const retry = useInvoiceRetryAction()
    const requestInvoice = useRequestInvoice()

    // A new invoice only makes sense when there is none, or all were rejected
    const hasActiveInvoice = invoices.some((i) => i.status !== 'rejected')
    // Invoicing authorized it but the sale never heard: the resend repeats the
    // result
    const resultLost =
        invoiceStatus === 'PENDING' &&
        invoices.some((i) => i.status === 'authorized')
    const canRequest =
        canWrite &&
        saleStatus === 'CONFIRMED' &&
        (!hasActiveInvoice || resultLost) &&
        !isError

    const handleRequest = async () => {
        try {
            await requestInvoice.mutateAsync(saleId)
            notifySuccess(
                'Venta reenviada a facturación',
                'La factura aparecerá aquí en unos momentos'
            )
        } catch (error) {
            notifyError(error, 'No se pudo reenviar la venta a facturación')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div>Cargando facturas...</div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="text-center py-8 text-red-500">
                No se pudieron cargar las facturas: el servicio de facturación
                no responde
            </div>
        )
    }

    return (
        <>
            {canRequest && (
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    <p className="text-sm">
                        {resultLost
                            ? 'El SRI autorizó la factura, pero la venta no recibió el resultado. Reenvíala para que facturación lo informe de nuevo.'
                            : invoices.length === 0
                            ? 'Esta venta no tiene factura. Si no aparece en unos minutos, reenvíala a facturación.'
                            : 'El SRI rechazó la factura. Corrige los datos (por ejemplo, los del cliente) y reenvía la venta para emitir una nueva.'}
                    </p>
                    <Button
                        size="sm"
                        loading={requestInvoice.isPending}
                        onClick={handleRequest}
                    >
                        Reenviar a facturación
                    </Button>
                </div>
            )}

            {invoices.length === 0 ? (
                !canRequest && (
                    <EmptyState
                        className="!py-8"
                        title="No hay facturas asociadas a esta venta"
                    />
                )
            ) : (
                <Table>
                    <THead>
                        <Tr>
                            <Th>Número</Th>
                            <Th>Estado</Th>
                            <Th>Motivo</Th>
                            <Th>Último Cambio</Th>
                            <Th />
                        </Tr>
                    </THead>
                    <TBody>
                        {invoices.map((invoice) => (
                            <Tr
                                key={invoice.id}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => setSelectedInvoice(invoice)}
                            >
                                <Td className="font-mono text-sm">
                                    {invoiceNumber(invoice.accessCode)}
                                </Td>
                                <Td>
                                    <StatusBadge
                                        tone={
                                            INVOICE_STATUS_TONES[invoice.status]
                                        }
                                    >
                                        {INVOICE_STATUS_LABELS[invoice.status]}
                                    </StatusBadge>
                                </Td>
                                <Td>
                                    <InvoiceReason invoice={invoice} />
                                </Td>
                                <Td>{formatDatetime(invoice.updatedAt)}</Td>
                                <Td>
                                    <InvoiceDocumentActions invoice={invoice} />
                                    {canWrite && !isFinalInvoice(invoice) && (
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            title="Reintentar ahora"
                                            icon={<HiOutlineRefresh />}
                                            loading={
                                                retry.retryingId === invoice.id
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                retry.run(invoice)
                                            }}
                                        />
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            )}

            <InvoicePreviewDialog
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
            />
        </>
    )
}

export default SaleInvoicesTab
