export type TaxType = 1 | 2 | 3 | 4

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
    1: 'RUC',
    2: 'Cédula',
    3: 'Pasaporte',
    4: 'ID Extranjero',
}

export type Customer = {
    id: number
    name: string
    taxId: string
    taxType: TaxType
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    creditLimit?: number | null
    paymentTerms?: number | null
    isActive: boolean
}

export type CustomerListParams = {
    limit?: number
    offset?: number
    /** Name or tax ID containing the text */
    search?: string
}

export type CustomerContact = {
    id: number
    customerId: number
    name: string
    role?: string | null
    email?: string | null
    phone?: string | null
}
