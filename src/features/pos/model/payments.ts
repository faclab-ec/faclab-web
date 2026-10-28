import { roundMoney } from '@shared/lib/money'
import type { POSPaymentMethod } from './types'

/*
 * Cómo se aplican los pagos al total, espejo de `Sale.settle` en faclab-core:
 * en orden, cada pago toma lo que falta y el resto de uno en efectivo es el
 * vuelto. Otro medio de pago no puede pasarse de lo que falta, y un pago que
 * llega con la venta ya cubierta sobra.
 */

export interface TenderedPayment {
    /** Lo que entrega el cliente */
    amount: number
    paymentMethod: POSPaymentMethod
}

export interface AppliedPayments {
    /** Lo que falta por cobrar */
    owed: number
    change: number
    covered: boolean
    /** Algún pago se pasa de lo que faltaba sin ser en efectivo, o sobra */
    exceeds: boolean
}

export function applyPayments(
    total: number,
    payments: TenderedPayment[]
): AppliedPayments {
    let owed = roundMoney(total)
    let change = 0
    let exceeds = false
    for (const payment of payments) {
        const tendered = roundMoney(payment.amount)
        const applied = Math.min(tendered, owed)
        const rest = roundMoney(tendered - applied)
        if (applied <= 0 || (rest > 0 && payment.paymentMethod !== 'CASH')) {
            exceeds = true
        }
        change = roundMoney(change + rest)
        owed = roundMoney(owed - applied)
    }
    return { owed, change, covered: owed <= 0, exceeds }
}
