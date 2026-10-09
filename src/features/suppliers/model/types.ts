export type TaxType = 1 | 2 | 3 | 4

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
    1: 'RUC',
    2: 'Cédula',
    3: 'Pasaporte',
    4: 'ID Extranjero',
}

export interface Supplier {
    id: number
    name: string
    taxId: string
    taxType: TaxType
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
    paymentTerms?: number | null
    leadTimeDays?: number | null
    notes?: string | null
    isActive: boolean
}

export interface SupplierContact {
    id: number
    supplierId: number
    name: string
    role?: string | null
    email?: string | null
    phone?: string | null
}

export interface SupplierProduct {
    id: number
    supplierId: number
    productId: number
    // Only in the product list of a supplier
    productName?: string | null
    productSku?: string | null
    purchasePrice: number
    supplierSku?: string | null
    minOrderQuantity?: number | null
    leadTimeDays?: number | null
    isPreferred: boolean
}

export interface SupplierListParams {
    limit?: number
    offset?: number
    isActive?: boolean
    /** Name or tax ID containing the text */
    search?: string
}
