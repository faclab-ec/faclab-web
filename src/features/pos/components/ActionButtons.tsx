import Button from '@/components/ui/Button'
import { usePOSStore } from '../store/usePOSStore'
import { useCartTotals } from '../hooks/useCartTotals'

interface ActionButtonsProps {
    onPayment: () => void
    onDiscount: () => void
    onHold: () => void
    onViewOrders: () => void
}

const ActionButtons = ({
    onPayment,
    onDiscount,
    onHold,
    onViewOrders,
}: ActionButtonsProps) => {
    const { cartItems, customerId, isFinalConsumer } = usePOSStore()
    const { total } = useCartTotals()
    const cartEmpty = cartItems.length === 0
    const requiresCustomer = total > 50
    const canPay =
        !cartEmpty &&
        (customerId !== null || (isFinalConsumer && !requiresCustomer))

    return (
        <div className="grid grid-cols-3 gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
            <Button
                block
                className="col-span-3"
                size="lg"
                variant="solid"
                disabled={!canPay}
                onClick={onPayment}
            >
                Cobrar
            </Button>
            <Button
                block
                size="sm"
                variant="default"
                disabled={cartEmpty}
                onClick={onHold}
            >
                Retener
            </Button>
            <Button
                block
                size="sm"
                variant="default"
                disabled={cartEmpty}
                onClick={onDiscount}
            >
                Descuento
            </Button>
            <Button block size="sm" variant="default" onClick={onViewOrders}>
                Órdenes
            </Button>
        </div>
    )
}

export default ActionButtons
