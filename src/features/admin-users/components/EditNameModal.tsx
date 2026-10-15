import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import FormModal from '@/components/shared/FormModal'
import { FormItem, FormContainer } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import type { AdminUserResponse } from '@/@types/auth'
import { userProfileSchema, type UserProfileFormValues } from '../model/schemas'
import { useUpdateUserProfile } from '../hooks/useAdminUsers'

interface EditNameModalProps {
    open: boolean
    user: AdminUserResponse
    onClose: () => void
}

const FORM_ID = 'edit-user-name'

/** Nombre con el que el usuario firma turnos, ventas y documentos. */
const EditNameModal = ({ open, user, onClose }: EditNameModalProps) => {
    const updateProfile = useUpdateUserProfile()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UserProfileFormValues>({
        resolver: zodResolver(userProfileSchema),
        defaultValues: { fullName: user.fullName ?? '' },
    })

    const onSubmit = async ({ fullName }: UserProfileFormValues) => {
        try {
            await updateProfile.mutateAsync({
                id: user.id,
                fullName: fullName || null,
            })
            notifySuccess('Nombre actualizado')
            onClose()
        } catch (err) {
            notifyError(err, 'Error al actualizar el nombre')
        }
    }

    return (
        <FormModal
            isOpen={open}
            title={`Nombre de ${user.username}`}
            formId={FORM_ID}
            width={480}
            isSubmitting={updateProfile.isPending}
            onClose={onClose}
        >
            <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
                <FormContainer>
                    <FormItem
                        label="Nombre completo"
                        invalid={!!errors.fullName}
                        errorMessage={errors.fullName?.message}
                    >
                        <Input
                            autoComplete="off"
                            placeholder={`Vacío: firma como ${user.username}`}
                            invalid={!!errors.fullName}
                            {...register('fullName')}
                        />
                    </FormItem>
                </FormContainer>
            </form>
        </FormModal>
    )
}

export default EditNameModal
