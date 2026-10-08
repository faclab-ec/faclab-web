import { z } from 'zod'
import { TAX_CODES } from '@/constants/tax.constant'

export const productSchema = z.object({
    name: z
        .string()
        .min(1, 'Nombre requerido')
        .max(200, 'Máximo 200 caracteres'),
    sku: z.string().min(1, 'SKU requerido').max(100, 'Máximo 100 caracteres'),
    description: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    categoryId: z.number().optional().nullable(),
    unitOfMeasureId: z.number().optional().nullable(),
    purchasePrice: z
        .number()
        .min(0, 'Debe ser mayor o igual a 0')
        .optional()
        .nullable(),
    salePrice: z
        .number()
        .min(0, 'Debe ser mayor o igual a 0')
        .optional()
        .nullable(),
    taxCode: z.enum(TAX_CODES),
    isActive: z.boolean().optional(),
    isService: z.boolean().optional(),
    minStock: z
        .number()
        .int('Debe ser entero')
        .min(0, 'Debe ser mayor o igual a 0')
        .optional(),
    maxStock: z
        .number()
        .int('Debe ser entero')
        .min(0, 'Debe ser mayor o igual a 0')
        .optional()
        .nullable(),
    reorderPoint: z
        .number()
        .int('Debe ser entero')
        .min(0, 'Debe ser mayor o igual a 0')
        .optional(),
    leadTimeDays: z
        .number()
        .int('Debe ser entero')
        .min(0, 'Debe ser mayor o igual a 0')
        .optional()
        .nullable(),
})

export type ProductFormValues = z.infer<typeof productSchema>
