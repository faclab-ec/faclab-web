import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, FormContainer } from '@/components/ui/Form'
import Alert from '@/components/ui/Alert'
import PasswordInput from '@/components/shared/PasswordInput'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import appConfig from '@/configs/app.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { ROLE } from '@/constants/roles.constant'
import useQuery from '@/utils/hooks/useQuery'
import { isApiError } from '@/utils/errors/ApiError'
import { signInSchema, type SignInFormValues } from '../model/schemas'
import { useLogin } from '../hooks/useAuth'
import { safeRedirectPath } from '../lib/safeRedirect'

const LOGIN_LOCKED_MESSAGE =
    'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.'

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
    const [message, setMessage] = useTimeOutMessage()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: { username: '', password: '' },
    })

    const onSubmit = async ({ username, password }: SignInFormValues) => {
        try {
            await loginMutation.mutateAsync({ username, password })
            const session = useAuthStore.getState().session
            if (session?.mustChangePassword) {
                navigate('/change-password', { replace: true })
            } else if (session?.role === ROLE.CASHIER) {
                navigate('/pos', { replace: true })
            } else {
                navigate(
                    safeRedirectPath(
                        query.get(REDIRECT_URL_KEY),
                        appConfig.authenticatedEntryPath
                    )
                )
            }
        } catch (err) {
            setMessage(signInErrorMessage(err))
        }
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
