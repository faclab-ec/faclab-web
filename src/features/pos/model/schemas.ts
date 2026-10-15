import { z } from 'zod'

export const shiftOpenSchema = z.object({
    openingBalance: z.number().min(0, 'El saldo inicial no puede ser negativo'),
    notes: z.string().optional(),
})

export type ShiftOpenFormValues = z.infer<typeof shiftOpenSchema>

export const cashMovementSchema = z.object({
    type: z.enum(['IN', 'OUT']),
    amount: z.number().positive('El monto debe ser mayor a cero'),
    reason: z.string().optional(),
})

export type CashMovementFormValues = z.infer<typeof cashMovementSchema>
