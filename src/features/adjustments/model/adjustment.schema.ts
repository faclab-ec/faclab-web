import { z } from 'zod'

export const adjustmentReasons = [
    'physical_count',
    'damaged',
    'theft',
    'expiration',
    'supplier_error',
    'correction',
    'other',
] as const

export const adjustmentSchema = z.object({
    warehouseId: z.number().int().min(1),
    reason: z.enum(adjustmentReasons),
    notes: z.string().optional(),
})

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>
