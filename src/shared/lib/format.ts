export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
    }).format(value)
}

export function formatDate(
    value: string | Date,
    opts?: Intl.DateTimeFormatOptions
): string {
    const date = typeof value === 'string' ? new Date(value) : value
    return date.toLocaleDateString('es-EC', opts)
}

export function formatDatetime(
    value: string | Date,
    opts?: Intl.DateTimeFormatOptions
): string {
    const date = typeof value === 'string' ? new Date(value) : value
    return date.toLocaleString('es-EC', opts)
}

// value is already in percent units (e.g. 12.5 → "12.5%"), not a fraction
export function formatPercent(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`
}

interface ProductRef {
    productId: number
    productName?: string | null
    productSku?: string | null
}

// Item lists from faclab-core carry the product name and SKU
export function formatProductLabel(item: ProductRef): string {
    if (!item.productName) return `#${item.productId}`
    return item.productSku
        ? `${item.productName} (${item.productSku})`
        : item.productName
}
