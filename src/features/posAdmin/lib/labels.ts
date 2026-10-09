import { POS_PAYMENT_METHOD_LABELS, type POSPaymentMethod } from '@features/pos'

// Reports return the payment method as a plain string
export const paymentMethodLabel = (method: string): string =>
    POS_PAYMENT_METHOD_LABELS[method as POSPaymentMethod] ?? method
