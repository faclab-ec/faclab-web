import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAdjustmentItemMutations } from '../hooks/useAdjustments'
import { ProductSelect } from '@features/products'
import { useLocationsList } from '@features/locations'
import { useLotsList } from '@features/lots'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import {
    adjustmentItemCreateSchema,
    adjustmentItemUpdateSchema,
    type AdjustmentItemCreateFormValues,
    type AdjustmentItemUpdateFormValues,
} from '../model/adjustmentItem.schema'
import type { AdjustmentItem } from '../model/types'

interface CreateFormProps {
    open: boolean
    onClose: () => void
    adjustmentId: number
    warehouseId: number
}

const AdjustmentItemCreateForm = ({
    open,
    onClose,
    adjustmentId,
    warehouseId,
}: CreateFormProps) => {
    const { add } = useAdjustmentItemMutations(adjustmentId)

    const { data: locationsData } = useLocationsList({
        warehouseId,
        limit: 100,
    })
    const locations = locationsData?.items ?? []

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<AdjustmentItemCreateFormValues>({
        resolver: zodResolver(adjustmentItemCreateSchema),
        defaultValues: {
            productId: undefined,
            locationId: undefined,
            actualQuantity: 0,
            lotId: null,
            notes: '',
        },
    })

    const numberRegister = makeNumberRegister(register)
    const selectedProductId = useWatch({ control, name: 'productId' })

    const { data: lotsData } = useLotsList(
        selectedProductId
            ? { productId: selectedProductId, limit: 100 }
            : undefined
    )
    const lots = lotsData?.items ?? []

    useEffect(() => {
        if (open) {
            reset({
                productId: undefined,
                locationId: undefined,
                actualQuantity: 0,
                lotId: null,
                notes: '',
            })
        }
    }, [open, adjustmentId, reset])

    useEffect(() => {
        setValue('lotId', null)
    }, [selectedProductId, setValue])

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    const locationOptions = locations.map((l) => ({
        value: l.id,
        label: `${l.name} (${l.code})`,
    }))

    const lotOptions: { value: number | null; label: string }[] = [
        { value: null, label: 'Sin lote' },
        ...lots.map((l) => ({ value: l.id, label: l.lotNumber })),
    ]

    const onSubmit = async (values: AdjustmentItemCreateFormValues) => {
        try {
            await add.mutateAsync({
                productId: values.productId,
                locationId: values.locationId,
                actualQuantity: values.actualQuantity,
                lotId: values.lotId,
                notes: values.notes || undefined,
            })
            notifySuccess('Item agregado')
            onClose()
        } catch (error: unknown) {
            notifyError(error, 'Error al agregar el item')
        }
    }

    return (
        <Dialog
            isOpen={open}
            width={600}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <div className="flex flex-col h-full justify-between">
                <h5 className="mb-4">Agregar Item</h5>
                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <FormItem
                            asterisk
                            label="Producto"
                            invalid={!!errors.productId}
                            errorMessage={errors.productId?.message}
                        >
                            <Controller
                                name="productId"
                                control={control}
                                render={({ field }) => (
                                    <ProductSelect
                                        inputId="productId"
                                        value={field.value}
                                        isDisabled={isSubmitting}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Ubicación"
                            invalid={!!errors.locationId}
                            errorMessage={errors.locationId?.message}
                        >
                            <ControlledSelect
                                name="locationId"
                                control={control}
                                options={locationOptions}
                                placeholder="Seleccionar ubicación"
                                isDisabled={isSubmitting}
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Cantidad Actual"
                            invalid={!!errors.actualQuantity}
                            errorMessage={errors.actualQuantity?.message}
                        >
                            <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                disabled={isSubmitting}
                                invalid={!!errors.actualQuantity}
                                {...numberRegister('actualQuantity', {
                                    integer: true,
                                    emptyValue: 0,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="Lote (opcional)"
                            invalid={!!errors.lotId}
                            errorMessage={errors.lotId?.message}
                        >
                            <ControlledSelect
                                name="lotId"
                                control={control}
                                options={lotOptions}
                                placeholder="Seleccionar lote"
                                isDisabled={isSubmitting || !selectedProductId}
                            />
                        </FormItem>

                        <FormItem
                            label="Notas"
                            invalid={!!errors.notes}
                            errorMessage={errors.notes?.message}
                        >
                            <Input
                                textArea
                                placeholder="Observaciones del item"
                                disabled={isSubmitting}
                                invalid={!!errors.notes}
                                {...register('notes')}
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
                            Agregar
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

interface UpdateFormProps {
    open: boolean
    onClose: () => void
    adjustmentId: number
    item: AdjustmentItem
}

const AdjustmentItemUpdateForm = ({
    open,
    onClose,
    adjustmentId,
    item,
}: UpdateFormProps) => {
    const { update } = useAdjustmentItemMutations(adjustmentId)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AdjustmentItemUpdateFormValues>({
        resolver: zodResolver(adjustmentItemUpdateSchema),
        defaultValues: {
            actualQuantity: item.actualQuantity,
            notes: item.notes ?? '',
        },
    })

    const numberRegister = makeNumberRegister(register)

    useEffect(() => {
        if (open) {
            reset({
                actualQuantity: item.actualQuantity,
                notes: item.notes ?? '',
            })
        }
    }, [open, item, reset])

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    const onSubmit = async (values: AdjustmentItemUpdateFormValues) => {
        try {
            await update.mutateAsync({
                itemId: item.id,
                data: {
                    actualQuantity: values.actualQuantity,
                    notes: values.notes || undefined,
                },
            })
            notifySuccess('Item actualizado')
            onClose()
        } catch (error: unknown) {
            notifyError(error, 'Error al actualizar el item')
        }
    }

    return (
        <Dialog
            isOpen={open}
            width={600}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <div className="flex flex-col h-full justify-between">
                <h5 className="mb-4">Editar Item</h5>
                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <FormItem
                            asterisk
                            label="Cantidad Actual"
                            invalid={!!errors.actualQuantity}
                            errorMessage={errors.actualQuantity?.message}
                        >
                            <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                disabled={isSubmitting}
                                invalid={!!errors.actualQuantity}
                                {...numberRegister('actualQuantity', {
                                    integer: true,
                                    emptyValue: 0,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="Notas"
                            invalid={!!errors.notes}
                            errorMessage={errors.notes?.message}
                        >
                            <Input
                                textArea
                                placeholder="Observaciones del item"
                                disabled={isSubmitting}
                                invalid={!!errors.notes}
                                {...register('notes')}
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
                            Actualizar
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

interface AdjustmentItemFormProps {
    open: boolean
    onClose: () => void
    adjustmentId: number
    warehouseId: number
    item: AdjustmentItem | null
}

const AdjustmentItemForm = ({
    open,
    onClose,
    adjustmentId,
    warehouseId,
    item,
}: AdjustmentItemFormProps) =>
    item ? (
        <AdjustmentItemUpdateForm
            open={open}
            adjustmentId={adjustmentId}
            item={item}
            onClose={onClose}
        />
    ) : (
        <AdjustmentItemCreateForm
            open={open}
            adjustmentId={adjustmentId}
            warehouseId={warehouseId}
            onClose={onClose}
        />
    )

export default AdjustmentItemForm
