import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import Input from '@/components/ui/Input'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { isApiError } from '@/utils/errors/ApiError'
import { ROLE, ROLE_LABELS, ALL_ROLES } from '@/constants/roles.constant'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateUserRequest } from '@/@types/auth'
import { createUserSchema, type CreateUserFormValues } from '../model/schemas'
import { useCreateAdminUser } from '../hooks/useAdminUsers'

interface CreateUserModalProps {
    open: boolean
    onClose: () => void
}

const roleOptions = ALL_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
}))

const CreateUserModal = ({ open, onClose }: CreateUserModalProps) => {
    const createUser = useCreateAdminUser()

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: '',
            fullName: '',
            email: '',
            password: '',
            role: ROLE.VIEWER,
        },
    })

    const handleClose = () => {
        if (!createUser.isPending) {
            reset()
            onClose()
        }
    }

    const onSubmit = async (values: CreateUserFormValues) => {
        try {
            await createUser.mutateAsync({
                ...values,
                fullName: values.fullName || null,
            } as CreateUserRequest)
            notifySuccess('Usuario creado')
            reset()
            onClose()
        } catch (err) {
            if (isApiError(err)) {
                if (err.code === 'USERNAME_ALREADY_EXISTS') {
                    setError('username', {
                        message: 'Este nombre de usuario ya existe',
                    })
                } else if (err.code === 'EMAIL_ALREADY_EXISTS') {
                    setError('email', {
                        message: 'Este email ya está registrado',
                    })
                } else {
                    notifyError(err, 'Error al crear el usuario')
                }
            } else {
                notifyError(err, 'Error al crear el usuario')
            }
        }
    }

    return (
        <Dialog
            isOpen={open}
            width={480}
            shouldCloseOnEsc={!createUser.isPending}
            shouldCloseOnOverlayClick={!createUser.isPending}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <h5 className="mb-4">Nuevo usuario</h5>
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormContainer>
                    <FormItem
                        label="Usuario"
                        invalid={!!errors.username}
                        errorMessage={errors.username?.message}
                    >
                        <Input
                            autoComplete="off"
                            placeholder="nombre.usuario"
                            invalid={!!errors.username}
                            {...register('username')}
                        />
                    </FormItem>
                    <FormItem
                        label="Nombre completo (opcional)"
                        invalid={!!errors.fullName}
                        errorMessage={errors.fullName?.message}
                    >
                        <Input
                            autoComplete="off"
                            placeholder="Con este nombre firma ventas y documentos"
                            invalid={!!errors.fullName}
                            {...register('fullName')}
                        />
                    </FormItem>
                    <FormItem
                        label="Email"
                        invalid={!!errors.email}
                        errorMessage={errors.email?.message}
                    >
                        <Input
                            type="email"
                            autoComplete="off"
                            placeholder="usuario@empresa.com"
                            invalid={!!errors.email}
                            {...register('email')}
                        />
                    </FormItem>
                    <FormItem
                        label="Contraseña"
                        invalid={!!errors.password}
                        errorMessage={errors.password?.message}
                    >
                        <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Mínimo 8 caracteres"
                            invalid={!!errors.password}
                            {...register('password')}
                        />
                    </FormItem>
                    <FormItem
                        label="Rol"
                        invalid={!!errors.role}
                        errorMessage={errors.role?.message}
                    >
                        <ControlledSelect
                            name="role"
                            control={control}
                            options={roleOptions}
                        />
                    </FormItem>
                    <div className="flex justify-end gap-2 mt-2">
                        <Button
                            variant="plain"
                            disabled={isSubmitting}
                            type="button"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            loading={isSubmitting}
                            type="submit"
                        >
                            Crear
                        </Button>
                    </div>
                </FormContainer>
            </form>
        </Dialog>
    )
}

export default CreateUserModal
