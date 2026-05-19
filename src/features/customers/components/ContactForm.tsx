import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { FormItem } from '@/components/ui/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import { contactSchema, type ContactFormValues } from '../model/contact.schema'
import { useCustomerContactMutations } from '../hooks/useCustomerContacts'
import type { CustomerContact } from '../model/types'

interface ContactFormProps {
    open: boolean
    onClose: () => void
    customerId: number
    contact?: CustomerContact | null
}

export const ContactForm = ({
    open,
    onClose,
    customerId,
    contact,
}: ContactFormProps) => {
    const { create, update } = useCustomerContactMutations(customerId)
    const isEdit = !!contact

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: '', role: '', email: '', phone: '' },
    })

    useEffect(() => {
        if (open) {
            reset(
                contact
                    ? {
                          name: contact.name,
                          role: contact.role ?? '',
                          email: contact.email ?? '',
                          phone: contact.phone ?? '',
                      }
                    : { name: '', role: '', email: '', phone: '' }
            )
        }
    }, [contact, open, reset])

    const handleClose = () => {
        if (!isSubmitting) {
            reset()
            onClose()
        }
    }

    const onSubmit = async (values: ContactFormValues) => {
        try {
            if (isEdit && contact) {
                await update.mutateAsync({ id: contact.id, data: values })
            } else {
                await create.mutateAsync(values)
            }
            toast.push(
                <Notification
                    title={isEdit ? 'Contacto actualizado' : 'Contacto creado'}
                    type="success"
                />,
                { placement: 'top-center' }
            )
            onClose()
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al guardar el contacto')}
                </Notification>,
                { placement: 'top-center' }
            )
        }
    }

    return (
        <Dialog
            isOpen={open}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <div className="flex flex-col h-full justify-between">
                <h5 className="mb-4">
                    {isEdit ? 'Editar Contacto' : 'Nuevo Contacto'}
                </h5>
                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <FormItem
                            asterisk
                            label="Nombre"
                            invalid={!!errors.name}
                            errorMessage={errors.name?.message}
                        >
                            <Input
                                placeholder="Nombre del contacto"
                                invalid={!!errors.name}
                                {...register('name')}
                            />
                        </FormItem>
                        <FormItem
                            label="Cargo"
                            invalid={!!errors.role}
                            errorMessage={errors.role?.message}
                        >
                            <Input
                                placeholder="Ej: Gerente de Compras"
                                {...register('role')}
                            />
                        </FormItem>
                        <FormItem
                            label="Email"
                            invalid={!!errors.email}
                            errorMessage={errors.email?.message}
                        >
                            <Input
                                type="email"
                                placeholder="email@ejemplo.com"
                                invalid={!!errors.email}
                                {...register('email')}
                            />
                        </FormItem>
                        <FormItem
                            label="Teléfono"
                            invalid={!!errors.phone}
                            errorMessage={errors.phone?.message}
                        >
                            <Input
                                placeholder="0987654321"
                                {...register('phone')}
                            />
                        </FormItem>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            disabled={isSubmitting}
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isSubmitting}
                        >
                            {isEdit ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}
