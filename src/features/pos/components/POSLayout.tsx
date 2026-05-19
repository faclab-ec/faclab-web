import { useState } from 'react'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { usePOSStore } from '../store/usePOSStore'
import {
    useCreateSale,
    useAddSaleItem,
    useApplySaleDiscount,
    useParkSale,
} from '../hooks/usePOS'
import POSHeader from './POSHeader'
import CategorySidebar from './CategorySidebar'
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
        <div className="flex flex-col h-full">
            <POSHeader
                onOpenCloseShift={() => setCloseShiftOpen(true)}
                onOpenCashMovement={() => setCashMovementOpen(true)}
                onOpenRefund={() => setRefundOpen(true)}
            />
            <div className="flex flex-1 min-h-0">
                <div className="w-16 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                    <CategorySidebar />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <SearchBar />
                    <ProductGrid />
                </div>

                <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                    <OrderPanel
                        onPayment={() => setPaymentOpen(true)}
                        onDiscount={() => setDiscountOpen(true)}
                        onHold={handleHold}
                        onViewOrders={() => setParkedOpen(true)}
                    />
                </div>
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
