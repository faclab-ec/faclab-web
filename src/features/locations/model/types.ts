// Values defined by faclab-core
export const LOCATION_TYPES = [
    'storage',
    'receiving',
    'shipping',
    'quality',
    'damaged',
] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
    storage: 'Almacenamiento',
    receiving: 'Recepción',
    shipping: 'Despacho',
    quality: 'Control de calidad',
    damaged: 'Dañados',
}

export type Location = {
    id: number
    warehouseId: number
    name: string
    code: string
    type: LocationType
    isActive: boolean
    capacity?: number | null
}

export type LocationListParams = {
    warehouseId?: number
    isActive?: boolean
    limit?: number
    offset?: number
}
