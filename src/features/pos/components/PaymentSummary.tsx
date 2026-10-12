import { formatCurrency } from '@shared/lib/format'
import { usePOSStore } from '../store/usePOSStore'
import { useCartTotals } from '../hooks/useCartTotals'

const PaymentSummary = () => {
    const { discountType, discountValue } = usePOSStore()
    const { subtotal, discountAmount, tax, total } = useCartTotals()

    return (
        <dl className="space-y-1.5 border-t border-gray-200 px-4 py-3 tabular-nums dark:border-gray-700">
            <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
            </div>
            {discountAmount > 0 && (
                <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">
                        Descuento
                        {discountType === 'PERCENTAGE' &&
                            ` (${discountValue}%)`}
                    </dt>
                    <dd className="text-red-600 dark:text-red-400">
                        -{formatCurrency(discountAmount)}
                    </dd>
                </div>
            )}
            <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">IVA</dt>
                <dd>{formatCurrency(tax)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <dt className="font-semibold text-gray-900 dark:text-gray-50">
                    Total
                </dt>
                <dd className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                    {formatCurrency(total)}
                </dd>
            </div>
        </dl>
    )
}

export default PaymentSummary
