import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { useReceipt } from '../hooks/usePOS'
import { HiOutlineCheckCircle } from 'react-icons/hi'
import { InvoiceReceiptNote } from '@features/invoicing'
import { formatCurrency } from '@shared/lib/format'
import { saleLabel } from '../lib/saleLabel'

interface ReceiptDialogProps {
    isOpen: boolean
    saleId: number
    onClose: () => void
}

const ReceiptDialog = ({ isOpen, saleId, onClose }: ReceiptDialogProps) => {
    const { data: receipt, isLoading } = useReceipt(saleId)

    const handlePrint = () => {
        window.print()
    }

    return (
        <Dialog
            isOpen={isOpen}
            contentLabel="Venta completada"
            width={400}
            overlayClassName="!z-[60]"
            onClose={onClose}
        >
            <div className="text-center mb-4">
                <HiOutlineCheckCircle className="text-5xl text-emerald-500 mx-auto" />
                <h4 className="mt-2">Venta completada</h4>
            </div>

            <div className="mb-4">
                <InvoiceReceiptNote />
            </div>

            {isLoading && (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            )}

            {receipt && (
                <div className="space-y-4 text-sm">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                            Venta{' '}
                            {saleLabel({
                                id: receipt.saleId,
                                number: receipt.number,
                            })}
                        </p>
                        {receipt.branch && (
                            <p>
                                {receipt.branch.establishmentCode}{' '}
                                {receipt.branch.name}
                                {receipt.branch.address &&
                                    ` — ${receipt.branch.address}`}
                            </p>
                        )}
                        {receipt.terminal && (
                            <p>
                                Caja {receipt.terminal.name} (
                                {receipt.terminal.code})
                            </p>
                        )}
                        <p>{receipt.cashier}</p>
                        {receipt.customer && (
                            <p>
                                {receipt.customer.name} —{' '}
                                {receipt.customer.taxId}
                            </p>
                        )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                        {receipt.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                                <span>
                                    {item.quantity}x {item.productName}
                                </span>
                                <span>{formatCurrency(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                                Subtotal
                            </span>
                            <span>{formatCurrency(receipt.subtotal)}</span>
                        </div>
                        {receipt.discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Descuento
                                </span>
                                <span className="text-red-500">
                                    -{formatCurrency(receipt.discount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                                Impuestos
                            </span>
                            <span>{formatCurrency(receipt.tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{formatCurrency(receipt.total)}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                        {/* What the customer handed over; the change below */}
                        {receipt.payments.map((p, i) => (
                            <div
                                key={i}
                                className="flex justify-between text-gray-500 dark:text-gray-400"
                            >
                                <span>{p.method}</span>
                                <span>{formatCurrency(p.amountTendered)}</span>
                            </div>
                        ))}
                    </div>

                    {receipt.change > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded text-center">
                            <span className="font-bold text-emerald-600">
                                Cambio: {formatCurrency(receipt.change)}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-2 mt-6">
                <Button block variant="default" onClick={onClose}>
                    Cerrar
                </Button>
                <Button block variant="solid" onClick={handlePrint}>
                    Imprimir
                </Button>
            </div>
        </Dialog>
    )
}

export default ReceiptDialog
