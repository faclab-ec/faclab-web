import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { useAdjustmentMutations } from '../hooks/useAdjustments'
import { useWarehousesList } from '@features/warehouses'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { ADJUSTMENT_REASON_LABELS } from '../model/types'
import {
    adjustmentReasons,
    adjustmentSchema,
    type AdjustmentFormValues,
} from '../model/adjustment.schema'

interface AdjustmentFormProps {
    open: boolean
    onClose: () => void
    onCreated?: (id: number) => void
}

const reasonOptions = adjustmentReasons.map((value) => ({
    value,
    label: ADJUSTMENT_REASON_LABELS[value],
}))

const AdjustmentForm = ({ open, onClose, onCreated }: AdjustmentFormProps) => {
    const { create } = useAdjustmentMutations()
    const { data: warehousesData } = useWarehousesList({ limit: 100 })
    const warehouses = warehousesData?.items ?? []

    const warehouseOptions = warehouses.map((w) => ({
        value: w.id,
        label: `${w.name} (${w.code})`,
    }))

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AdjustmentFormValues>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: { reason: 'physical_count', notes: '' },
    })

    useEffect(() => {
        if (open) reset({ reason: 'physical_count', notes: '' })
    }, [open, reset])

    const onSubmit = async (values: AdjustmentFormValues) => {
        try {
            const adjustment = await create.mutateAsync({
                warehouseId: values.warehouseId,
                reason: values.reason,
                notes: values.notes || undefined,
            })
            notifySuccess('Ajuste creado', 'El ajuste se creó correctamente')
            onClose()
            onCreated?.(adjustment.id)
        } catch (error: unknown) {
            notifyError(error, 'Error al crear el ajuste')
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
                <h5 className="mb-4">Nuevo Ajuste de Inventario</h5>
                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <FormContainer>
                        <FormItem
                            asterisk
                            label="Almacén"
                            invalid={!!errors.warehouseId}
                            errorMessage={errors.warehouseId?.message}
                        >
                            <ControlledSelect
                                name="warehouseId"
                                control={control}
                                options={warehouseOptions}
                                isDisabled={isSubmitting}
                                placeholder="Seleccionar almacén"
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Motivo"
                            invalid={!!errors.reason}
                            errorMessage={errors.reason?.message}
                        >
                            <ControlledSelect
                                name="reason"
                                control={control}
                                options={reasonOptions}
                                isDisabled={isSubmitting}
                                placeholder="Seleccionar motivo"
                            />
                        </FormItem>

                        <FormItem
                            label="Notas"
                            invalid={!!errors.notes}
                            errorMessage={errors.notes?.message}
                        >
                            <Input
                                textArea
                                placeholder="Observaciones del ajuste"
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

export default AdjustmentForm
