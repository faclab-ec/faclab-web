import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { FormItem } from '@/components/ui/Form'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { useSerialNumberMutations } from '../hooks/useSerialNumbers'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import {
    SERIAL_STATUS_LABELS,
    VALID_TRANSITIONS,
    type SerialNumber,
    type SerialStatus,
} from '../model/types'
import {
    serialStatusChangeSchema,
    type SerialStatusChangeFormValues,
} from '../model/serialStatusChange.schema'

interface StatusChangeDialogProps {
    open: boolean
    onClose: () => void
    serialNumber: SerialNumber | null
}

export const StatusChangeDialog = ({
    open,
    onClose,
    serialNumber,
}: StatusChangeDialogProps) => {
    const { changeStatus } = useSerialNumberMutations()

    const validTargets = serialNumber
        ? VALID_TRANSITIONS[serialNumber.status]
        : []

    const statusOptions = validTargets.map((s) => ({
        value: s,
        label: SERIAL_STATUS_LABELS[s],
    }))

    const noTransitions = validTargets.length === 0

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SerialStatusChangeFormValues>({
        resolver: zodResolver(serialStatusChangeSchema),
        defaultValues: { status: validTargets[0] ?? '' },
    })

    useEffect(() => {
        if (serialNumber) {
            const targets = VALID_TRANSITIONS[serialNumber.status]
            reset({ status: targets[0] ?? '' })
        } else {
            reset({ status: '' })
        }
    }, [serialNumber, open, reset])

    const onSubmit = async (data: SerialStatusChangeFormValues) => {
        if (!serialNumber) return

        try {
            await changeStatus.mutateAsync({
                id: serialNumber.id,
                status: data.status as SerialStatus,
            })

            toast.push(
                <Notification title="Estado actualizado" type="success">
                    El estado se cambió a{' '}
                    {SERIAL_STATUS_LABELS[data.status as SerialStatus]}
                </Notification>,
                { placement: 'top-end' }
            )

            onClose()
        } catch (error: unknown) {
            const errorMessage = getErrorMessage(
                error,
                'Error al cambiar el estado'
            )

            toast.push(
                <Notification title="Error" type="danger">
                    {errorMessage}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleClose = () => {
        if (!changeStatus.isPending) {
            onClose()
        }
    }

    return (
        <Dialog
            isOpen={open}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <h5 className="mb-4">Cambiar Estado</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Serial: <strong>{serialNumber?.serialNumber}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Estado actual:{' '}
                <strong>
                    {serialNumber
                        ? SERIAL_STATUS_LABELS[serialNumber.status]
                        : ''}
                </strong>
            </p>

            {noTransitions ? (
                <p className="text-sm text-gray-500 mb-6">
                    Este serial se encuentra en estado final y no permite
                    transiciones.
                </p>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem
                        label="Nuevo Estado"
                        invalid={!!errors.status}
                        errorMessage={errors.status?.message}
                    >
                        <ControlledSelect
                            name="status"
                            control={control}
                            options={statusOptions}
                            isDisabled={isSubmitting}
                            placeholder="Seleccione un estado"
                        />
                    </FormItem>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            disabled={changeStatus.isPending}
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={changeStatus.isPending}
                        >
                            Cambiar Estado
                        </Button>
                    </div>
                </form>
            )}
        </Dialog>
    )
}
