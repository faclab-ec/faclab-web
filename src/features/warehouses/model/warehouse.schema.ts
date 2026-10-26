import { z } from 'zod'

const optionalEmail = z
    .union([z.email('Email inválido'), z.literal('')])
    .optional()

export const warehouseSchema = z.object({
    // Al editar no cambia: el backend fija la sucursal al crear la bodega
    branchId: z
        .number({ error: 'Sucursal requerida' })
        .int()
        .positive('Sucursal requerida'),
    name: z
        .string()
        .min(1, 'Nombre requerido')
        .max(200, 'Máximo 200 caracteres'),
    code: z.string().min(1, 'Código requerido').max(50, 'Máximo 50 caracteres'),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    manager: z.string().optional(),
    phone: z.string().optional(),
    email: optionalEmail,
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
})

export type WarehouseFormValues = z.infer<typeof warehouseSchema>
