import { usePOSStore } from '../store/usePOSStore'
import OrderItemRow from './OrderItemRow'
import CustomerSelector from './CustomerSelector'
import PaymentSummary from './PaymentSummary'
import ActionButtons from './ActionButtons'
import EmptyState from '@/components/shared/EmptyState'
import { HiOutlineShoppingCart } from 'react-icons/hi'

interface OrderPanelProps {
    onPayment: () => void
    onDiscount: () => void
    onHold: () => void
    onViewOrders: () => void
}

const OrderPanel = ({
    onPayment,
    onDiscount,
    onHold,
    onViewOrders,
}: OrderPanelProps) => {
    const { cartItems } = usePOSStore()

    return (
        <div className="flex h-full flex-col">
            <div className="hidden border-b border-gray-200 px-4 py-3 dark:border-gray-700 lg:block">
                <h2 className="text-base">Orden</h2>
            </div>

            <CustomerSelector />

            <div className="flex-1 overflow-y-auto p-4">
                {cartItems.length === 0 ? (
                    <EmptyState
                        className="h-full !py-6"
                        icon={<HiOutlineShoppingCart />}
                        title="Carrito vacío"
                        description="Selecciona productos para agregarlos."
                    />
                ) : (
                    <ul className="space-y-3">
                        {cartItems.map((item) => (
                            <li key={item.productId}>
                                <OrderItemRow item={item} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <PaymentSummary />

            <ActionButtons
                onPayment={onPayment}
                onDiscount={onDiscount}
                onHold={onHold}
                onViewOrders={onViewOrders}
            />
        </div>
    )
}

export default OrderPanel
