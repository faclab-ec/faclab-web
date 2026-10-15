import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { useTransferMutations } from '../hooks/useTransfers'
import { useLocationsList } from '@features/locations'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import {
    transferSchema,
    type TransferFormValues,
} from '../model/transfer.schema'

interface TransferFormProps {
    open: boolean
    onClose: () => void
    onCreated?: (id: number) => void
}

const TransferForm = ({ open, onClose, onCreated }: TransferFormProps) => {
    const { create } = useTransferMutations()
    const { data: locationsData } = useLocationsList({ limit: 100 })
    const locations = locationsData?.items ?? []

    const locationOptions = locations.map((l) => ({
        value: l.id,
        label: `${l.name} (${l.code})`,
    }))

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransferFormValues>({
        resolver: zodResolver(transferSchema),
        defaultValues: { notes: '' },
    })

    useEffect(() => {
        if (open) reset({ notes: '' })
    }, [open, reset])

    const onSubmit = async (values: TransferFormValues) => {
        try {
            const transfer = await create.mutateAsync({
                sourceLocationId: values.sourceLocationId,
                destinationLocationId: values.destinationLocationId,
                notes: values.notes || undefined,
            })
            notifySuccess(
                'Transferencia creada',
                'La transferencia se creó correctamente'
            )
            onClose()
            onCreated?.(transfer.id)
        } catch (error: unknown) {
            notifyError(error, 'Error al crear la transferencia')
        }
    }

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    return (
        <Dialog
            isOpen={open}
            width={600}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <div className="flex flex-col h-full justify-between">
                <h5 className="mb-4">Nueva Transferencia</h5>
                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <FormContainer>
                        <FormItem
                            asterisk
                            label="Ubicación Origen"
                            invalid={!!errors.sourceLocationId}
                            errorMessage={errors.sourceLocationId?.message}
                        >
                            <ControlledSelect
                                name="sourceLocationId"
                                control={control}
                                options={locationOptions}
                                isDisabled={isSubmitting}
                                placeholder="Seleccionar ubicación origen"
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Ubicación Destino"
                            invalid={!!errors.destinationLocationId}
                            errorMessage={errors.destinationLocationId?.message}
                        >
                            <ControlledSelect
                                name="destinationLocationId"
                                control={control}
                                options={locationOptions}
                                isDisabled={isSubmitting}
                                placeholder="Seleccionar ubicación destino"
                            />
                        </FormItem>

                        <FormItem
                            label="Notas"
                            invalid={!!errors.notes}
                            errorMessage={errors.notes?.message}
                        >
                            <Input
                                textArea
                                placeholder="Observaciones de la transferencia"
                                disabled={isSubmitting}
                                invalid={!!errors.notes}
                                {...register('notes')}
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

export default TransferForm
