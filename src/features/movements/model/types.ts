// Values defined by faclab-core
export const MOVEMENT_TYPES = ['IN', 'OUT'] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export interface Movement {
    id: number
    productId: number
    quantity: number
    type: MovementType
    reason?: string | null
    date?: string | null
}

export interface MovementInput {
    productId: number
    quantity: number
    type: MovementType
    reason?: string
    date?: string
}

export interface MovementListParams {
    productId?: number
    type?: MovementType
    fromDate?: string
    toDate?: string
    limit?: number
    offset?: number
}
