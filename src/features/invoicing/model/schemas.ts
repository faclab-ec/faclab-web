import { z } from 'zod'
import { optionalEmail } from '@shared/lib/schemas/common'
import { RIMPE_REGIMES } from './types'

export const companyConfigSchema = z.object({
    // El RUC de la empresa de la sesión: no se edita
    taxId: z.string().regex(/^\d{13}$/, 'El RUC tiene 13 dígitos'),
    name: z
        .string()
        .trim()
        .min(1, 'Razón social requerida')
        .max(64, 'Máximo 64 caracteres'),
    tradeName: z
        .string()
        .trim()
        .min(1, 'Nombre comercial requerido')
        .max(64, 'Máximo 64 caracteres'),
    mainAddress: z
        .string()
        .trim()
        .min(1, 'Dirección matriz requerida')
        .max(300),
    environment: z.union([z.literal(1), z.literal(2)]),
    emissionType: z.literal(1),
    signingCertId: z.string().optional().nullable(),
    accountingRequired: z.boolean().optional(),
    rimpeRegime: z.enum(RIMPE_REGIMES).nullable(),
    specialTaxpayerResolution: z
        .string()
        .max(32, 'Máximo 32 caracteres')
        .optional(),
    withholdingAgentResolution: z
        .string()
        .max(32, 'Máximo 32 caracteres')
        .optional(),
    // Reply-To de los correos con sus facturas
    email: optionalEmail,
})

export type CompanyConfigFormValues = z.infer<typeof companyConfigSchema>

export const certificateUploadSchema = z.object({
    file: z.instanceof(File, { error: 'Selecciona un archivo .p12' }),
    password: z.string().min(1, 'Contraseña requerida'),
})

export type CertificateUploadFormValues = z.infer<
    typeof certificateUploadSchema
>

export const nextSequenceSchema = z.object({
    nextSequence: z
        .number({ error: 'Número requerido' })
        .int('Número entero')
        .min(1, 'Desde 1')
        .max(999999999, 'Hasta 999999999'),
})

export type NextSequenceFormValues = z.infer<typeof nextSequenceSchema>
