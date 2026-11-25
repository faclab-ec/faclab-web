import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { FormContainer, FormItem } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import { usePlatformLogin } from '../hooks/usePlatform'
import { PLATFORM_ERROR_MESSAGES } from '../model/types'

const schema = z.object({
    username: z.string().min(1, 'Requerido'),
    password: z.string().min(1, 'Requerido'),
})
type FormValues = z.infer<typeof schema>

/** Ingreso del equipo de la plataforma: sin empresa, con su propio token. */
const PlatformSignInPage = () => {
    const navigate = useNavigate()
    const login = usePlatformLogin()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) })

    const submit = async (values: FormValues) => {
        try {
            await login.mutateAsync(values)
            navigate('/platform/tenants', { replace: true })
        } catch {
            // El mensaje sale de `login.error`
        }
    }

    return (
        <div className="mx-auto mt-24 w-full max-w-sm px-4">
            <h3 className="mb-1">Consola de plataforma</h3>
            <p className="mb-6 text-gray-500">Solo para el equipo de Faclab.</p>
            {login.error && (
                <Alert showIcon type="danger" className="mb-4">
                    {getErrorMessage(
                        login.error,
                        'No se pudo ingresar',
                        PLATFORM_ERROR_MESSAGES
                    )}
                </Alert>
            )}
            <form onSubmit={handleSubmit(submit)}>
                <FormContainer>
                    <FormItem
                        label="Usuario"
                        invalid={!!errors.username}
                        errorMessage={errors.username?.message}
                    >
                        <Input
                            autoComplete="username"
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
                            invalid={!!errors.password}
                            {...register('password')}
                        />
                    </FormItem>
                    <Button
                        block
                        variant="solid"
                        type="submit"
                        loading={login.isPending}
                    >
                        Ingresar
                    </Button>
                </FormContainer>
            </form>
        </div>
    )
}

export default PlatformSignInPage
