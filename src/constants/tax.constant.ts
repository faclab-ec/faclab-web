/**
 * Códigos semánticos de IVA. Espejo de `TaxCode` en faclab-core
 * (src/shared/domain/tax.py): 0%, exento y no objeto comparten tarifa 0
 * pero son códigos distintos para el SRI.
 */
export const TAX_CODES = [
    'VAT_0',
    'VAT_5',
    'VAT_8_TOURISM',
    'VAT_12',
    'VAT_13',
    'VAT_14',
    'VAT_15',
    'EXEMPT',
    'NOT_TAXED',
] as const

export type TaxCode = (typeof TAX_CODES)[number]

export const DEFAULT_TAX_CODE: TaxCode = 'VAT_15'

export const TAX_CODE_LABELS: Record<TaxCode, string> = {
    VAT_0: 'IVA 0%',
    VAT_5: 'IVA 5%',
    VAT_8_TOURISM: 'IVA 8% (turismo)',
    VAT_12: 'IVA 12%',
    VAT_13: 'IVA 13%',
    VAT_14: 'IVA 14%',
    VAT_15: 'IVA 15%',
    EXEMPT: 'Exento de IVA',
    NOT_TAXED: 'No objeto de IVA',
}

/** Tarifa de IVA de cada código, como porcentaje (0-100). */
export const TAX_CODE_RATES: Record<TaxCode, number> = {
    VAT_0: 0,
    VAT_5: 5,
    VAT_8_TOURISM: 8,
    VAT_12: 12,
    VAT_13: 13,
    VAT_14: 14,
    VAT_15: 15,
    EXEMPT: 0,
    NOT_TAXED: 0,
}
