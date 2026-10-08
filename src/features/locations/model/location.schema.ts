import { z } from 'zod'
import { LOCATION_TYPES } from './types'

export const locationSchema = z.object({
    warehouseId: z
        .number({ error: 'Debe seleccionar una bodega' })
        .int()
        .min(1, 'Debe seleccionar una bodega'),
    name: z.string().min(1, 'Nombre requerido'),
    code: z.string().min(1, 'Código requerido'),
    type: z.enum(LOCATION_TYPES),
    isActive: z.boolean().optional(),
    capacity: z.number().int().min(0).nullable().optional(),
})

export type LocationFormValues = z.infer<typeof locationSchema>
