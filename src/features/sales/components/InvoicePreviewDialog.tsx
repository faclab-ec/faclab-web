import Dialog from '@/components/ui/Dialog'
import Badge from '@/components/ui/Badge'
import { formatDatetime } from '@shared/lib/format'
import {
    INVOICE_STATUS_LABELS,
    INVOICE_STATUS_CLASSES,
    InvoiceReason,
    type Invoice,
    type InvoiceStatus,
} from '@features/invoicing'

interface InvoicePreviewDialogProps {
    invoice: Invoice | null
    onClose: () => void
}

const InvoicePreviewDialog = ({
    invoice,
    onClose,
}: InvoicePreviewDialogProps) => (
    <Dialog isOpen={invoice !== null} width={640} onClose={onClose}>
        {invoice && (
            <div>
                <h5 className="mb-4">Detalle de Factura</h5>
                <div className="grid grid-cols-1 gap-3 mb-6">
                    <div>
                        <p className="text-sm text-gray-500">
                            Código de Acceso
                        </p>
                        <p className="font-mono text-xs break-all mt-1">
                            {invoice.accessCode ??
                                'Se genera al construir la factura'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Estado</p>
                            <Badge
                                content={INVOICE_STATUS_LABELS[invoice.status]}
                                className={
                                    INVOICE_STATUS_CLASSES[invoice.status]
                                }
                            />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">
                                ID Certificado
                            </p>
                            <p className="font-mono text-xs break-all mt-1">
                                {invoice.signatureId ?? '-'}
                            </p>
                        </div>
                    </div>
                    {(invoice.issue || invoice.status === 'pending') && (
                        <div>
                            <p className="text-sm text-gray-500">Motivo</p>
                            <div className="mt-1">
                                <InvoiceReason invoice={invoice} />
                            </div>
                            {invoice.issue && (
                                <p className="text-xs text-gray-400 mt-1 break-words">
                                    {invoice.issue.message} (intentos:{' '}
                                    {invoice.attempts})
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <h6 className="mb-3">Historial de Estados</h6>
                {invoice.statusHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin historial</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {invoice.statusHistory.map((entry, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                            >
                                <Badge
                                    content={
                                        INVOICE_STATUS_LABELS[
                                            entry.name as InvoiceStatus
                                        ] ?? entry.name
                                    }
                                    className={
                                        INVOICE_STATUS_CLASSES[
                                            entry.name as InvoiceStatus
                                        ] ?? 'bg-gray-100 text-gray-600'
                                    }
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500">
                                        {formatDatetime(entry.statusDate)}
                                    </p>
                                    {entry.description && (
                                        <p className="text-sm mt-1">
                                            {entry.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </Dialog>
)

export default InvoicePreviewDialog
