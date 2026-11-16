import type {
    CashSummary,
    CloseShiftInput,
    CountablePaymentMethod,
} from '../model/types'

/**
 * Una fila del arqueo al cerrar el turno (S5.9): lo que el medio debería tener
 * y lo que el cajero escribe (texto del input, vacío mientras no cuenta).
 */
export interface CountRow {
    paymentMethod: CountablePaymentMethod
    expected: number
    counted: string
    justification: string
}

/** En centavos, sin el error binario de multiplicar por 100 */
const cents = (value: number): number =>
    Math.round(Number((value * 100).toPrecision(15)))

/** Las filas a contar: las que da el resumen de caja (el efectivo siempre) */
export function countRows(summary: CashSummary): CountRow[] {
    return summary.byMethod.map((method) => ({
        paymentMethod: method.paymentMethod,
        expected: method.expected,
        counted: '',
        justification: '',
    }))
}

/** Lo contado de una fila, o null si todavía no es un monto válido */
export function countedAmount(row: CountRow): number | null {
    if (row.counted.trim() === '') return null
    const value = Number(row.counted)
    return Number.isFinite(value) && value >= 0 ? value : null
}

/** Contado − esperado, a centavos; null mientras no se cuenta */
export function countDifference(row: CountRow): number | null {
    const counted = countedAmount(row)
    if (counted === null) return null
    return (cents(counted) - cents(row.expected)) / 100
}

/**
 * Si la fila exige justificación: su diferencia supera el umbral en valor
 * absoluto, como en faclab-core (igual al umbral no la exige)
 */
export function needsJustification(row: CountRow, threshold: number): boolean {
    const difference = countDifference(row)
    return difference !== null && Math.abs(cents(difference)) > cents(threshold)
}

/** Lo que falta para cerrar: un medio sin contar o una justificación */
export function countIsComplete(rows: CountRow[], threshold: number): boolean {
    return rows.every(
        (row) =>
            countedAmount(row) !== null &&
            (!needsJustification(row, threshold) ||
                row.justification.trim() !== '')
    )
}

/** El cuerpo de `POST /shifts/{id}/close` */
export function toCloseInput(rows: CountRow[], notes: string): CloseShiftInput {
    return {
        counts: rows.map((row) => {
            const justification = row.justification.trim()
            return {
                paymentMethod: row.paymentMethod,
                counted: countedAmount(row) ?? 0,
                ...(justification ? { justification } : {}),
            }
        }),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
    }
}
