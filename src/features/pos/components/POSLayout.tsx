import { useState } from 'react'
import classNames from 'classnames'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { usePOSStore } from '../store/usePOSStore'
import {
    useCreateSale,
    useAddSaleItem,
    useApplySaleDiscount,
    useParkSale,
} from '../hooks/usePOS'
import POSHeader from './POSHeader'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'
import ProductGrid from './ProductGrid'
import OrderPanel from './OrderPanel'
import PaymentDialog from './PaymentDialog'
import DiscountDialog from './DiscountDialog'
import ParkedSalesDrawer from './ParkedSalesDrawer'
import ReceiptDialog from './ReceiptDialog'
import ShiftCloseDialog from './ShiftCloseDialog'
import CashMovementDialog from './CashMovementDialog'
import RefundDialog from './RefundDialog'

const POSLayout = () => {
    const {
        cartItems,
        customerId,
        isFinalConsumer,
        discountType,
        discountValue,
        clearCart,
    } = usePOSStore()

    const [paymentOpen, setPaymentOpen] = useState(false)
    const [discountOpen, setDiscountOpen] = useState(false)
    const [parkedOpen, setParkedOpen] = useState(false)
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [receiptSaleId, setReceiptSaleId] = useState(0)
    const [closeShiftOpen, setCloseShiftOpen] = useState(false)
    const [cashMovementOpen, setCashMovementOpen] = useState(false)
    const [refundOpen, setRefundOpen] = useState(false)
    // En pantallas pequeñas no caben los dos paneles: se alterna entre ellos
    const [mobileView, setMobileView] = useState<'products' | 'order'>(
        'products'
    )
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    const createSale = useCreateSale()
    const addSaleItem = useAddSaleItem()
    const applySaleDiscount = useApplySaleDiscount()
    const parkSale = useParkSale()

    const handlePaymentComplete = (saleId: number) => {
        setPaymentOpen(false)
        setReceiptSaleId(saleId)
        setReceiptOpen(true)
    }

    const handleHold = async () => {
        if (cartItems.length === 0) return

        try {
            const sale = await createSale.mutateAsync({
                customerId: customerId || undefined,
                isFinalConsumer,
            })

            for (const item of cartItems) {
                await addSaleItem.mutateAsync({
                    saleId: sale.id,
                    data: {
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.salePrice,
                        discount: item.discount > 0 ? item.discount : undefined,
                    },
                })
            }

            if (discountType && discountValue > 0) {
                await applySaleDiscount.mutateAsync({
                    saleId: sale.id,
                    data: { discountType, discountValue },
                })
            }

            await parkSale.mutateAsync({ saleId: sale.id })

            clearCart()
            notifySuccess('Venta retenida')
        } catch (error: unknown) {
            notifyError(error, 'Error al retener la venta')
        }
    }

    return (
        <div className="flex h-full flex-col">
            <POSHeader
                onOpenCloseShift={() => setCloseShiftOpen(true)}
                onOpenCashMovement={() => setCashMovementOpen(true)}
                onOpenRefund={() => setRefundOpen(true)}
            />
            <div
                role="tablist"
                aria-label="Vista del punto de venta"
                className="grid grid-cols-2 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:hidden"
            >
                {(
                    [
                        ['products', 'Productos'],
                        ['order', `Orden (${itemCount})`],
                    ] as const
                ).map(([view, label]) => (
                    <button
                        key={view}
                        type="button"
                        role="tab"
                        aria-selected={mobileView === view}
                        className={classNames(
                            'border-b-2 py-3 text-sm font-semibold transition-colors duration-150',
                            mobileView === view
                                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-300'
                                : 'border-transparent text-gray-500 dark:text-gray-400'
                        )}
                        onClick={() => setMobileView(view)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className="flex min-h-0 flex-1">
                <section
                    aria-label="Productos"
                    className={classNames(
                        'min-w-0 flex-1 overflow-y-auto p-4 lg:block',
                        mobileView === 'products' ? 'block' : 'hidden'
                    )}
                >
                    <SearchBar />
                    <CategoryFilter />
                    <ProductGrid />
                </section>

                <aside
                    aria-label="Orden"
                    className={classNames(
                        'w-full flex-col border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:flex lg:w-[22rem] lg:border-l xl:w-96',
                        mobileView === 'order' ? 'flex' : 'hidden'
                    )}
                >
                    <OrderPanel
                        onPayment={() => setPaymentOpen(true)}
                        onDiscount={() => setDiscountOpen(true)}
                        onHold={handleHold}
                        onViewOrders={() => setParkedOpen(true)}
                    />
                </aside>
            </div>

            <PaymentDialog
                isOpen={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                onComplete={handlePaymentComplete}
            />

            <DiscountDialog
                isOpen={discountOpen}
                onClose={() => setDiscountOpen(false)}
            />

            <ParkedSalesDrawer
                isOpen={parkedOpen}
                onClose={() => setParkedOpen(false)}
            />

            <ReceiptDialog
                isOpen={receiptOpen}
                saleId={receiptSaleId}
                onClose={() => {
                    setReceiptOpen(false)
                    setReceiptSaleId(0)
                }}
            />

            <ShiftCloseDialog
                isOpen={closeShiftOpen}
                onClose={() => setCloseShiftOpen(false)}
            />

            <CashMovementDialog
                isOpen={cashMovementOpen}
                onClose={() => setCashMovementOpen(false)}
            />

            <RefundDialog
                isOpen={refundOpen}
                onClose={() => setRefundOpen(false)}
            />
        </div>
    )
}

export default POSLayout
