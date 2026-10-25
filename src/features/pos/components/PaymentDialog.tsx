import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { notifyError } from '@shared/ui/notify'
import { POS_ERROR_MESSAGES } from '../model/errors'
import { usePOSStore, isPriceOverridden } from '../store/usePOSStore'
import { useCartTotals } from '../hooks/useCartTotals'
import { useQuickSale } from '../hooks/usePOS'
import {
    POS_PAYMENT_METHOD_LABELS,
    POS_PAYMENT_METHODS,
    type POSPaymentMethod,
    type QuickSalePaymentInput,
} from '../model/types'
import { HiOutlineTrash } from 'react-icons/hi'
import { formatCurrency } from '@shared/lib/format'

interface PaymentDialogProps {
    isOpen: boolean
    onClose: () => void
    onComplete: (saleId: number) => void
}

const PaymentDialog = ({ isOpen, onClose, onComplete }: PaymentDialogProps) => {
    const { cartItems, customerId, discountType, discountValue, clearCart } =
        usePOSStore()
    const quickSale = useQuickSale()
    // Already in whole cents, computed like the backend total
    const { total } = useCartTotals()

    const [selectedMethod, setSelectedMethod] =
        useState<POSPaymentMethod>('CASH')
    const [amount, setAmount] = useState<string>('')
    const [reference, setReference] = useState('')
    const [payments, setPayments] = useState<QuickSalePaymentInput[]>([])

    const currentAmount = amount === '' ? total : Number(amount)
    const totalPayments =
        payments.reduce((sum, p) => sum + p.amount, 0) + currentAmount
    const change =
        selectedMethod === 'CASH' && totalPayments > total
            ? totalPayments - total
            : 0
    const canComplete = totalPayments >= total

    const handleAddPayment = () => {
        if (currentAmount <= 0) return
        setPayments([
            ...payments,
            {
                amount: currentAmount,
                paymentMethod: selectedMethod,
                reference: reference || undefined,
            },
        ])
        setAmount('')
        setReference('')
    }

    const handleRemovePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index))
    }

    const handleComplete = async () => {
        const finalPayments: QuickSalePaymentInput[] =
            payments.length > 0
                ? payments
                : [
                      {
                          amount:
                              selectedMethod === 'CASH' ? total : currentAmount,
                          paymentMethod: selectedMethod,
                          reference: reference || undefined,
                      },
                  ]

        try {
            const sale = await quickSale.mutateAsync({
                customerId: customerId || undefined,
                items: cartItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.salePrice,
                    discount: item.discount > 0 ? item.discount : undefined,
                    overrideReason: isPriceOverridden(item)
                        ? item.overrideReason
                        : undefined,
                })),
                payments: finalPayments,
                ...(discountType && discountValue > 0
                    ? { discountType, discountValue }
                    : {}),
            })
            clearCart()
            resetForm()
            onComplete(sale.id)
        } catch (error: unknown) {
            notifyError(error, 'Error al procesar la venta', {
                messages: POS_ERROR_MESSAGES,
            })
        }
    }

    const resetForm = () => {
        setSelectedMethod('CASH')
        setAmount('')
        setReference('')
        setPayments([])
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    return (
        <Dialog
            isOpen={isOpen}
            contentLabel="Cobrar"
            width={500}
            overlayClassName="!z-[60]"
            onClose={handleClose}
        >
            <h4 className="mb-4">Cobrar</h4>

            <div className="text-center mb-6">
                <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                    {formatCurrency(total)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total a cobrar
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                {POS_PAYMENT_METHODS.map((method) => (
                    <Button
                        key={method}
                        block
                        variant={
                            selectedMethod === method ? 'solid' : 'default'
                        }
                        size="sm"
                        aria-pressed={selectedMethod === method}
                        onClick={() => setSelectedMethod(method)}
                    >
                        {POS_PAYMENT_METHOD_LABELS[method]}
                    </Button>
                ))}
            </div>

            <Input
                type="number"
                step="any"
                aria-label="Monto recibido"
                value={amount}
                placeholder={total.toFixed(2)}
                prefix="$"
                onChange={(e) => setAmount(e.target.value)}
            />

            {selectedMethod !== 'CASH' && (
                <Input
                    className="mt-3"
                    value={reference}
                    aria-label="Referencia del pago"
                    placeholder="Referencia (opcional)"
                    onChange={(e) => setReference(e.target.value)}
                />
            )}

            {selectedMethod === 'CASH' && change > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg mt-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cambio
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                        {formatCurrency(change)}
                    </p>
                </div>
            )}

            {payments.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Pagos registrados:</p>
                    {payments.map((p, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                            <span className="text-sm">
                                {POS_PAYMENT_METHOD_LABELS[p.paymentMethod]} —
                                {formatCurrency(p.amount)}
                            </span>
                            <Button
                                size="xs"
                                variant="plain"
                                aria-label="Quitar pago"
                                icon={
                                    <HiOutlineTrash className="text-red-500" />
                                }
                                onClick={() => handleRemovePayment(i)}
                            />
                        </div>
                    ))}
                    <Button
                        size="sm"
                        variant="twoTone"
                        disabled={currentAmount <= 0}
                        onClick={handleAddPayment}
                    >
                        Agregar pago parcial
                    </Button>
                </div>
            )}

            {payments.length === 0 && (
                <div className="mt-3">
                    <button
                        type="button"
                        className="link text-sm"
                        onClick={handleAddPayment}
                    >
                        Dividir pago
                    </button>
                </div>
            )}

            <div className="flex gap-2 mt-6">
                <Button block variant="default" onClick={handleClose}>
                    Cancelar
                </Button>
                <Button
                    block
                    variant="solid"
                    loading={quickSale.isPending}
                    disabled={!canComplete}
                    onClick={handleComplete}
                >
                    Completar venta
                </Button>
            </div>
        </Dialog>
    )
}

export default PaymentDialog
