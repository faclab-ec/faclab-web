import { describe, expect, it } from 'vitest'
import type { CashSummary } from '../../model/types'
import {
    countDifference,
    countIsComplete,
    countRows,
    needsJustification,
    toCloseInput,
    type CountRow,
} from '../shiftCount'

const summary = (): CashSummary => ({
    shiftId: 7,
    openingBalance: 50,
    cashSales: 120,
    cashRefunds: 10,
    customerPayments: 20,
    cashIn: 5,
    cashOut: 15,
    expectedBalance: 170,
    byMethod: [
        {
            paymentMethod: 'CASH',
            paymentsTotal: 120,
            customerPaymentsTotal: 20,
            refundsTotal: 10,
            expected: 170,
        },
        {
            paymentMethod: 'CREDIT_CARD',
            paymentsTotal: 45.5,
            customerPaymentsTotal: 0,
            refundsTotal: 0,
            expected: 45.5,
        },
    ],
    justificationThreshold: 1,
})

const row = (counted: string, expected = 170): CountRow => ({
    paymentMethod: 'CASH',
    expected,
    counted,
    justification: '',
})

describe('arqueo del cierre de turno', () => {
    it('cuenta los medios que da el resumen de caja, sin montos', () => {
        expect(countRows(summary())).toEqual([
            {
                paymentMethod: 'CASH',
                expected: 170,
                counted: '',
                justification: '',
            },
            {
                paymentMethod: 'CREDIT_CARD',
                expected: 45.5,
                counted: '',
                justification: '',
            },
        ])
    })

    it('la diferencia es contado menos esperado, a centavos', () => {
        expect(countDifference(row(''))).toBeNull()
        expect(countDifference(row('abc'))).toBeNull()
        expect(countDifference(row('169.9'))).toBe(-0.1)
        expect(countDifference(row('0.3', 0.1))).toBe(0.2)
    })

    it('exige justificación solo sobre el umbral, como el core', () => {
        expect(needsJustification(row('171'), 1)).toBe(false)
        expect(needsJustification(row('169'), 1)).toBe(false)
        expect(needsJustification(row('171.01'), 1)).toBe(true)
        expect(needsJustification(row('168.99'), 1)).toBe(true)
        expect(needsJustification(row('170.01'), 0)).toBe(true)
        expect(needsJustification(row(''), 0)).toBe(false)
    })

    it('se puede cerrar con todo contado y cada diferencia justificada', () => {
        const rows = countRows(summary())
        expect(countIsComplete(rows, 1)).toBe(false)

        rows[0].counted = '160'
        rows[1].counted = '45.50'
        expect(countIsComplete(rows, 1)).toBe(false)

        rows[0].justification = '  Billete falso  '
        expect(countIsComplete(rows, 1)).toBe(true)
    })

    it('envía cada medio con lo contado y solo las justificaciones escritas', () => {
        const rows = countRows(summary())
        rows[0].counted = '160'
        rows[0].justification = '  Billete falso  '
        rows[1].counted = '45.50'

        expect(toCloseInput(rows, '  ')).toEqual({
            counts: [
                {
                    paymentMethod: 'CASH',
                    counted: 160,
                    justification: 'Billete falso',
                },
                { paymentMethod: 'CREDIT_CARD', counted: 45.5 },
            ],
        })
        expect(toCloseInput(rows, ' Sin novedad ').notes).toBe('Sin novedad')
    })
})
