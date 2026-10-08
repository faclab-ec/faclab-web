import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { notifySuccess, notifyWarning, notifyError } from '@shared/ui/notify'
import { roundMoney } from '@shared/lib/money'
import { useCreateRefund, useProcessRefund } from '../hooks/usePOS'
import { getSale, getSaleItems, getProduct } from '../api/client'
import { discountFactor, taxBreakdown } from '../model/totals'
import {
    POS_PAYMENT_METHOD_LABELS,
    POS_PAYMENT_METHODS,
    type POSSale,
    type POSSaleItem,
    type POSPaymentMethod,
} from '../model/types'
import { HiOutlineSearch, HiMinus, HiPlus } from 'react-icons/hi'

interface RefundDialogProps {
    isOpen: boolean
    onClose: () => void
}

interface RefundItemSelection {
    saleItem: POSSaleItem
    productName: string
    maxQuantity: number
    selectedQuantity: number
}

const RefundDialog = ({ isOpen, onClose }: RefundDialogProps) => {
    const [saleIdInput, setSaleIdInput] = useState('')
    const [sale, setSale] = useState<POSSale | null>(null)
    const [items, setItems] = useState<RefundItemSelection[]>([])
    const [loading, setLoading] = useState(false)
    const [reason, setReason] = useState('')
    const [step, setStep] = useState<'search' | 'select' | 'payment'>('search')
    const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('CASH')
    const [refundId, setRefundId] = useState<number | null>(null)
    // Amount computed by the backend once the refund exists
    const [refundTotal, setRefundTotal] = useState(0)

    const createRefund = useCreateRefund()
    const processRefund = useProcessRefund()

    const handleSearch = async () => {
        const id = parseInt(saleIdInput)
        if (!id || id <= 0) return

        setLoading(true)
        try {
            const saleResponse = await getSale(id)
            const saleData = saleResponse.data

            if (saleData.status !== 'CONFIRMED') {
                notifyWarning('La venta debe estar confirmada para devolver')
                setLoading(false)
                return
            }

            const itemsResponse = await getSaleItems(id)
            const saleItems = itemsResponse.data

            const selections: RefundItemSelection[] = []
            for (const item of saleItems) {
                const productResponse = await getProduct(item.productId)
                const product = productResponse.data
                selections.push({
                    saleItem: item,
                    productName: product.name,
                    maxQuantity: item.quantity,
                    selectedQuantity: 0,
                })
            }

            setSale(saleData)
            setItems(selections)
            setStep('select')
        } catch (error: unknown) {
            notifyError(error, 'Venta no encontrada')
        } finally {
            setLoading(false)
        }
    }

    const updateQuantity = (index: number, qty: number) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                          ...item,
                          selectedQuantity: Math.max(
                              0,
                              Math.min(qty, item.maxQuantity)
                          ),
                      }
                    : item
            )
        )
    }

    const selectedItems = items.filter((i) => i.selectedQuantity > 0)

    // Preview: what was charged for these items, with the sale's global
    // discount prorated, rounded like the backend refund
    const preview = taxBreakdown(
        selectedItems.map((item) => ({
            taxCode: item.saleItem.taxCode,
            subtotal:
                item.saleItem.unitPrice *
                item.selectedQuantity *
                (1 - item.saleItem.discount / 100),
        })),
        sale ? discountFactor(sale.subtotal, sale.discount) : 1
    )
    const previewTotal = roundMoney(preview.base + preview.tax)

    const handleCreateRefund = async () => {
        if (selectedItems.length === 0 || !sale) return

        try {
            const refund = await createRefund.mutateAsync({
                originalSaleId: sale.id,
                items: selectedItems.map((i) => ({
                    saleItemId: i.saleItem.id,
                    quantity: i.selectedQuantity,
                })),
                reason: reason || undefined,
            })
            setRefundId(refund.id)
            setRefundTotal(refund.total)
            setStep('payment')
        } catch (error: unknown) {
            notifyError(error, 'Error al crear la devolución')
        }
    }

    const handleProcessRefund = async () => {
        if (!refundId) return

        try {
            await processRefund.mutateAsync({
                refundId,
                data: {
                    payments: [
                        {
                            amount: refundTotal,
                            paymentMethod,
                        },
                    ],
                },
            })
            notifySuccess('Devolución procesada correctamente')
            handleClose()
        } catch (error: unknown) {
            notifyError(error, 'Error al procesar la devolución')
        }
    }

    const handleClose = () => {
        setSaleIdInput('')
        setSale(null)
        setItems([])
        setReason('')
        setStep('search')
        setPaymentMethod('CASH')
        setRefundId(null)
        setRefundTotal(0)
        onClose()
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={550}
            overlayClassName="!z-[60]"
            onClose={handleClose}
        >
            <h4 className="text-lg font-bold mb-4">Devolución</h4>

            {step === 'search' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ingrese el número de venta para iniciar la devolución
                    </p>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            value={saleIdInput}
                            placeholder="# de venta"
                            prefix={
                                <HiOutlineSearch className="text-gray-400" />
                            }
                            onChange={(e) => setSaleIdInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearch()
                            }}
                        />
                        <Button
                            variant="solid"
                            loading={loading}
                            onClick={handleSearch}
                        >
                            Buscar
                        </Button>
                    </div>
                </div>
            )}

            {step === 'select' && sale && (
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm font-medium">Venta #{sale.id}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total: ${sale.total.toFixed(2)}
                        </p>
                    </div>

                    <p className="text-sm font-medium">
                        Seleccione items a devolver:
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {items.map((item, index) => (
                            <div
                                key={item.saleItem.id}
                                className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-600 rounded"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {item.productName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        ${item.saleItem.unitPrice.toFixed(2)} x{' '}
                                        {item.maxQuantity} (máx)
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<HiMinus />}
                                        onClick={() =>
                                            updateQuantity(
                                                index,
                                                item.selectedQuantity - 1
                                            )
                                        }
                                    />
                                    <span className="w-8 text-center text-sm font-medium">
                                        {item.selectedQuantity}
                                    </span>
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<HiPlus />}
                                        onClick={() =>
                                            updateQuantity(
                                                index,
                                                item.selectedQuantity + 1
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Input
                        value={reason}
                        placeholder="Razón de devolución (opcional)"
                        onChange={(e) => setReason(e.target.value)}
                    />

                    {previewTotal > 0 && (
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Total a devolver
                            </p>
                            <p className="text-xl font-bold text-red-500">
                                ${previewTotal.toFixed(2)}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button block variant="default" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            block
                            variant="solid"
                            disabled={selectedItems.length === 0}
                            loading={createRefund.isPending}
                            onClick={handleCreateRefund}
                        >
                            Continuar
                        </Button>
                    </div>
                </div>
            )}

            {step === 'payment' && (
                <div className="space-y-4">
                    {loading && (
                        <div className="flex justify-center py-4">
                            <Spinner />
                        </div>
                    )}

                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Total a devolver
                        </p>
                        <p className="text-3xl font-bold text-red-500">
                            ${refundTotal.toFixed(2)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-2">
                            Método de pago:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {POS_PAYMENT_METHODS.map((method) => (
                                <Button
                                    key={method}
                                    block
                                    variant={
                                        paymentMethod === method
                                            ? 'solid'
                                            : 'default'
                                    }
                                    size="sm"
                                    onClick={() => setPaymentMethod(method)}
                                >
                                    {POS_PAYMENT_METHOD_LABELS[method]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            block
                            variant="default"
                            onClick={() => setStep('select')}
                        >
                            Atrás
                        </Button>
                        <Button
                            block
                            variant="solid"
                            loading={processRefund.isPending}
                            onClick={handleProcessRefund}
                        >
                            Procesar Devolución
                        </Button>
                    </div>
                </div>
            )}
        </Dialog>
    )
}

export default RefundDialog
