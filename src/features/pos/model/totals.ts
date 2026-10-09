import { TAX_CODE_RATES, type TaxCode } from '@/constants/tax.constant'
import { roundMoney } from '@shared/lib/money'

/*
 * Cálculo de IVA con descuento global, espejo de `src/sales/domain/services.py`
 * en faclab-core. Las líneas van a precisión completa; los montos por código
 * de IVA se redondean a centavos, como en la factura.
 */

export interface TaxedLine {
    taxCode: TaxCode
    /** precio × cantidad × (1 - descuento_item%), sin redondear */
    subtotal: number
}

/** Fracción de la base que queda después del descuento global de la venta */
export function discountFactor(subtotal: number, discount: number): number {
    return subtotal > 0 ? (subtotal - discount) / subtotal : 1
}

/** Base imponible e IVA, con el descuento global prorrateado y redondeados por código */
export function taxBreakdown(
    lines: TaxedLine[],
    factor: number
): { base: number; tax: number } {
    const subtotalByCode = new Map<TaxCode, number>()
    for (const line of lines) {
        subtotalByCode.set(
            line.taxCode,
            (subtotalByCode.get(line.taxCode) ?? 0) + line.subtotal
        )
    }

    let base = 0
    let tax = 0
    for (const [code, subtotal] of subtotalByCode) {
        base += roundMoney(subtotal * factor)
        tax += roundMoney(subtotal * (TAX_CODE_RATES[code] / 100) * factor)
    }
    return { base: roundMoney(base), tax: roundMoney(tax) }
}
