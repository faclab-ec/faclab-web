import { useState } from 'react'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { formatDatetime } from '@shared/lib/format'
import {
    INVOICE_STATUS_LABELS,
    INVOICE_STATUS_CLASSES,
    type Invoice,
} from '../model/types'
import { useInvoicesBySale } from '../hooks/useSales'
import InvoicePreviewDialog from './InvoicePreviewDialog'

const { Tr, Th, Td, THead, TBody } = Table

interface SaleInvoicesTabProps {
    saleId: number
}

const SaleInvoicesTab = ({ saleId }: SaleInvoicesTabProps) => {
    const { data: invoices = [], isLoading } = useInvoicesBySale(saleId)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div>Cargando facturas...</div>
            </div>
        )
    }

    if (invoices.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No hay facturas asociadas a esta venta
            </div>
        )
    }

    return (
        <>
            <Table>
                <THead>
                    <Tr>
                        <Th>Código de Acceso</Th>
                        <Th>Estado</Th>
                        <Th>Último Cambio</Th>
                    </Tr>
                </THead>
                <TBody>
                    {invoices.map((invoice) => {
                        const lastEntry =
                            invoice.statusHistory[
                                invoice.statusHistory.length - 1
                            ]
                        return (
                            <Tr
                                key={invoice.id}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => setSelectedInvoice(invoice)}
                            >
                                <Td className="font-mono text-xs break-all">
                                    {invoice.accessCode}
                                </Td>
                                <Td>
                                    <Badge
                                        content={
                                            INVOICE_STATUS_LABELS[
                                                invoice.status
                                            ]
                                        }
                                        className={
                                            INVOICE_STATUS_CLASSES[
                                                invoice.status
                                            ]
                                        }
                                    />
                                </Td>
                                <Td>
                                    {lastEntry
                                        ? formatDatetime(lastEntry.statusDate)
                                        : '-'}
                                </Td>
                            </Tr>
                        )
                    })}
                </TBody>
            </Table>

            <InvoicePreviewDialog
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
            />
        </>
    )
}

export default SaleInvoicesTab
