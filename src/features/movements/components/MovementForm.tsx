import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useMovementMutations } from '../hooks/useMovements'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import {
    movementSchema,
    type MovementFormValues,
} from '../model/movement.schema'

interface MovementFormProps {
    open: boolean
    onClose: () => void
}

const typeOptions = [
    { value: 'in' as const, label: 'Entrada' },
    { value: 'out' as const, label: 'Salida' },
]

const MovementForm = ({ open, onClose }: MovementFormProps) => {
    const { create } = useMovementMutations()

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<MovementFormValues>({
        resolver: zodResolver(movementSchema),
        defaultValues: { type: 'in', reason: '', date: '' },
    })

    const numberRegister = makeNumberRegister(register)

    useEffect(() => {
        if (open) reset({ type: 'in', reason: '', date: '' })
    }, [open, reset])

    const onSubmit = async (values: MovementFormValues) => {
        const signedQuantity =
            Math.abs(values.quantity) * (values.type === 'in' ? 1 : -1)
        try {
            await create.mutateAsync({
                ...values,
                quantity: signedQuantity,
                reason: values.reason || undefined,
                date: values.date || undefined,
            })
            toast.push(
                <Notification title="Movimiento creado" type="success">
                    El movimiento se registró correctamente
                </Notification>,
                { placement: 'top-end' }
            )
            onClose()
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al crear el movimiento')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    return (
        <Dialog
            isOpen={open}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <div className="flex flex-col h-full justify-between">
                <h5 className="mb-4">Nuevo Movimiento</h5>
                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <FormContainer>
                        <FormItem
                            asterisk
                            label="ID Producto"
                            invalid={!!errors.productId}
                            errorMessage={errors.productId?.message}
                        >
                            <Input
                                type="number"
                                placeholder="ID del producto"
                                disabled={isSubmitting}
                                invalid={!!errors.productId}
                                {...numberRegister('productId', {
                                    integer: true,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Tipo"
                            invalid={!!errors.type}
                            errorMessage={errors.type?.message}
                        >
                            <ControlledSelect
                                name="type"
                                control={control}
                                options={typeOptions}
                                isDisabled={isSubmitting}
                                placeholder="Seleccionar tipo"
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Cantidad"
                            invalid={!!errors.quantity}
                            errorMessage={errors.quantity?.message}
                        >
                            <Input
                                type="number"
                                placeholder="Ej: 100"
                                disabled={isSubmitting}
                                invalid={!!errors.quantity}
                                {...numberRegister('quantity', {
                                    integer: true,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="Motivo"
                            invalid={!!errors.reason}
                            errorMessage={errors.reason?.message}
                        >
                            <Input
                                textArea
                                placeholder="Motivo del movimiento (opcional)"
                                style={{ minHeight: '80px' }}
                                disabled={isSubmitting}
                                invalid={!!errors.reason}
                                {...register('reason')}
                            />
                        </FormItem>

                        <FormItem
                            label="Fecha"
                            invalid={!!errors.date}
                            errorMessage={errors.date?.message}
                        >
                            <Input
                                type="datetime-local"
                                disabled={isSubmitting}
                                invalid={!!errors.date}
                                {...register('date')}
                            />
                        </FormItem>
                    </FormContainer>

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
                            Crear
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default MovementForm
