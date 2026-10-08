export type Stock = {
    id: number
    productId: number
    productName: string | null
    quantity: number
    locationId: number | null
    locationName: string | null
    reservedQuantity: number
}

export type StockListParams = {
    productId?: number
    limit?: number
    offset?: number
}
