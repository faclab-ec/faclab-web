import { z } from 'zod'

// Códigos SRI de establecimiento y punto de emisión: tres dígitos, sin 000
const sriCode = z.string().regex(/^(?!000)\d{3}$/, 'Tres dígitos, de 001 a 999')

export const branchSchema = z.object({
    establishmentCode: sriCode,
    name: z
        .string()
        .trim()
        .min(1, 'Nombre requerido')
        .max(128, 'Máximo 128 caracteres'),
    address: z.string().trim().max(300, 'Máximo 300 caracteres'),
    isActive: z.boolean(),
})

export type BranchFormValues = z.infer<typeof branchSchema>

// La sucursal la pone la página: no se elige ni cambia en el formulario
export const emissionPointSchema = z.object({
    code: sriCode,
    name: z.string().trim().max(128, 'Máximo 128 caracteres'),
    isActive: z.boolean(),
})

export type EmissionPointFormValues = z.infer<typeof emissionPointSchema>

export const posTerminalSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, 'Código requerido')
        .max(32, 'Máximo 32 caracteres'),
    name: z
        .string()
        .trim()
        .min(1, 'Nombre requerido')
        .max(128, 'Máximo 128 caracteres'),
    emissionPointId: z
        .number({ error: 'Punto de emisión requerido' })
        .int()
        .positive('Punto de emisión requerido'),
    defaultLocationId: z
        .number({ error: 'Ubicación requerida' })
        .int()
        .positive('Ubicación requerida'),
    isActive: z.boolean(),
})

export type PosTerminalFormValues = z.infer<typeof posTerminalSchema>
