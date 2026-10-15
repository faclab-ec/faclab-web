import { z } from 'zod'

export const transferSchema = z
    .object({
        sourceLocationId: z.number().int().min(1),
        destinationLocationId: z.number().int().min(1),
        notes: z.string().optional(),
    })
    .refine((d) => d.sourceLocationId !== d.destinationLocationId, {
        message: 'Las ubicaciones deben ser diferentes',
        path: ['destinationLocationId'],
    })

export type TransferFormValues = z.infer<typeof transferSchema>
