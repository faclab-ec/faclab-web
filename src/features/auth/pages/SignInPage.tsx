import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, FormContainer } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'
import PasswordInput from '@/components/shared/PasswordInput'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import useQuery from '@/utils/hooks/useQuery'
import { isApiError } from '@/utils/errors/ApiError'
import type { Session, TenantOption } from '@/@types/auth'
import { signInSchema, type SignInFormValues } from '../model/schemas'
import { useLogin, useSelectTenant } from '../hooks/useAuth'
import { entryPathFor } from '../lib/entryPath'
import TenantPicker from '../components/TenantPicker'

const LOGIN_LOCKED_MESSAGE =
    'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.'

const SELECTION_EXPIRED_MESSAGE =
    'La elección de empresa venció. Ingresa tus credenciales de nuevo.'

type TenantSelectionStep = {
    selectionToken: string
    tenants: TenantOption[]
}

const signInErrorMessage = (err: unknown): string => {
    if (isApiError(err)) {
        return err.code === 'LOGIN_LOCKED' ? LOGIN_LOCKED_MESSAGE : err.message
    }
    return err instanceof Error ? err.message : String(err)
}

const SignInForm = () => {
    const navigate = useNavigate()
    const query = useQuery()
    const loginMutation = useLogin()
    const selectTenantMutation = useSelectTenant()
    const [message, setMessage] = useTimeOutMessage()
    // El token de selección solo vive aquí, en memoria
    const [selection, setSelection] = useState<TenantSelectionStep | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: { username: '', password: '' },
    })

    const enter = (session: Session) =>
        navigate(entryPathFor(session, query.get(REDIRECT_URL_KEY)), {
            replace: true,
        })

    const onSubmit = async ({ username, password }: SignInFormValues) => {
        try {
            const result = await loginMutation.mutateAsync({
                username,
                password,
            })
            if (result.status === 'select-tenant') {
                setSelection(result)
                return
            }
            enter(result.session)
        } catch (err) {
            setMessage(signInErrorMessage(err))
        }
    }

    const onSelectTenant = async (tenant: TenantOption) => {
        if (!selection) return
        try {
            enter(
                await selectTenantMutation.mutateAsync({
                    tenantId: tenant.id,
                    selectionToken: selection.selectionToken,
                })
            )
        } catch (err) {
            if (
                isApiError(err) &&
                (err.code === 'TOKEN_EXPIRED' || err.code === 'INVALID_TOKEN')
            ) {
                setSelection(null)
                setMessage(SELECTION_EXPIRED_MESSAGE)
            } else {
                setMessage(signInErrorMessage(err))
            }
        }
    }

    if (selection) {
        const pending = selectTenantMutation.isPending
        return (
            <div>
                <div className="mb-8">
                    <h3 className="mb-1">Elige la empresa</h3>
                    <p>Tu usuario trabaja en varias empresas.</p>
                </div>
                {message && (
                    <Alert showIcon className="mb-4" type="danger">
                        <>{message}</>
                    </Alert>
                )}
                <TenantPicker
                    tenants={selection.tenants}
                    pendingId={
                        pending
                            ? selectTenantMutation.variables?.tenantId
                            : null
                    }
                    disabled={pending}
                    onSelect={onSelectTenant}
                />
                <Button
                    block
                    variant="plain"
                    className="mt-4"
                    disabled={pending}
                    onClick={() => setSelection(null)}
                >
                    Volver
                </Button>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h3 className="mb-1">Bienvenido</h3>
                <p>Ingresa tus credenciales para continuar</p>
            </div>
            {message && (
                <Alert showIcon className="mb-4" type="danger">
                    <>{message}</>
                </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormContainer>
                    <FormItem
                        label="Usuario"
                        invalid={!!errors.username}
                        errorMessage={errors.username?.message}
                    >
                        <Input
                            type="text"
                            autoComplete="username"
                            placeholder="Usuario"
                            invalid={!!errors.username}
                            {...register('username')}
                        />
                    </FormItem>
                    <FormItem
                        label="Contraseña"
                        invalid={!!errors.password}
                        errorMessage={errors.password?.message}
                    >
                        <PasswordInput
                            autoComplete="current-password"
                            placeholder="Contraseña"
                            invalid={!!errors.password}
                            {...register('password')}
                        />
                    </FormItem>
                    <Button
                        block
                        loading={isSubmitting}
                        variant="solid"
                        type="submit"
                        className="mt-2"
                    >
                        {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </FormContainer>
            </form>
        </div>
    )
}

export default SignInForm
