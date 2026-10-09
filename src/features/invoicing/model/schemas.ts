import { z } from 'zod'

export const companyConfigSchema = z.object({
    taxId: z.string().regex(/^\d{13}$/, 'El RUC tiene 13 dígitos'),
    name: z.string().min(1, 'Razón social requerida').max(300),
    tradeName: z.string().min(1, 'Nombre comercial requerido').max(300),
    mainAddress: z.string().min(1).max(300),
    branchAddress: z.string().min(1).max(300),
    // The SRI requires exactly 3 digits (e.g. 001)
    branchCode: z.string().regex(/^\d{3}$/, 'Tres dígitos, por ejemplo 001'),
    salePointCode: z.string().regex(/^\d{3}$/, 'Tres dígitos, por ejemplo 001'),
    environment: z.union([z.literal(1), z.literal(2)]),
    emissionType: z.literal(1),
    invoiceSequence: z.number().int().positive().optional(),
    signingCertId: z.string().optional().nullable(),
    accountingRequired: z.boolean().optional(),
    specialTaxpayerResolution: z.string().optional(),
    withholdingAgentResolution: z.string().optional(),
})

export type CompanyConfigFormValues = z.infer<typeof companyConfigSchema>

export const certificateUploadSchema = z.object({
    file: z.instanceof(File, { error: 'Selecciona un archivo .p12' }),
    password: z.string().min(1, 'Contraseña requerida'),
})

export type CertificateUploadFormValues = z.infer<
    typeof certificateUploadSchema
>
