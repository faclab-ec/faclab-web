import { z } from 'zod'
import { MOVEMENT_TYPES } from './types'

export const movementSchema = z.object({
    productId: z.number().int().min(1),
    quantity: z
        .number()
        .int()
        .refine((v) => v !== 0, 'No puede ser cero'),
    type: z.enum(MOVEMENT_TYPES),
    reason: z.string().optional(),
    date: z.string().optional(),
})

export type MovementFormValues = z.infer<typeof movementSchema>
