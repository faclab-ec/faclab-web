import { z } from 'zod'
import { ALL_ROLES } from '@/constants/roles.constant'

export const createUserSchema = z.object({
    username: z
        .string()
        .min(1, 'Ingresa el nombre de usuario')
        .max(64, 'Máximo 64 caracteres'),
    fullName: z.string().trim().max(64, 'Máximo 64 caracteres').optional(),
    email: z
        .string()
        .min(1, 'Ingresa el email')
        .email('Email inválido')
        .max(128, 'Máximo 128 caracteres'),
    password: z
        .string()
        .min(8, 'Mínimo 8 caracteres')
        .max(128, 'Máximo 128 caracteres'),
    role: z
        .number({ error: 'Selecciona un rol' })
        .refine((v) => (ALL_ROLES as number[]).includes(v), {
            error: 'Selecciona un rol válido',
        }),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const userProfileSchema = z.object({
    fullName: z.string().trim().max(64, 'Máximo 64 caracteres'),
})

export type UserProfileFormValues = z.infer<typeof userProfileSchema>

export const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
