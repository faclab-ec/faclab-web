import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransferItemMutations } from '../hooks/useTransfers'
import { ProductSelect } from '@features/products'
import { useLotsList } from '@features/lots'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import {
    transferItemCreateSchema,
    transferItemUpdateSchema,
    type TransferItemCreateFormValues,
    type TransferItemUpdateFormValues,
} from '../model/transferItem.schema'
import type { TransferItem } from '../model/types'

interface CreateFormProps {
    open: boolean
    onClose: () => void
    transferId: number
}

const TransferItemCreateForm = ({
    open,
    onClose,
    transferId,
}: CreateFormProps) => {
    const { add } = useTransferItemMutations(transferId)

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<TransferItemCreateFormValues>({
        resolver: zodResolver(transferItemCreateSchema),
        defaultValues: {
            productId: undefined,
            quantity: 1,
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
                quantity: 1,
                lotId: null,
                notes: '',
            })
        }
    }, [open, transferId, reset])

    useEffect(() => {
        setValue('lotId', null)
    }, [selectedProductId, setValue])

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    const lotOptions: { value: number | null; label: string }[] = [
        { value: null, label: 'Sin lote' },
        ...lots.map((l) => ({ value: l.id, label: l.lotNumber })),
    ]

    const onSubmit = async (values: TransferItemCreateFormValues) => {
        try {
            await add.mutateAsync({
                productId: values.productId,
                quantity: values.quantity,
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
                            label="Cantidad"
                            invalid={!!errors.quantity}
                            errorMessage={errors.quantity?.message}
                        >
                            <Input
                                type="number"
                                min={1}
                                placeholder="1"
                                disabled={isSubmitting}
                                invalid={!!errors.quantity}
                                {...numberRegister('quantity', {
                                    integer: true,
                                    emptyValue: 1,
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
    transferId: number
    item: TransferItem
}

const TransferItemUpdateForm = ({
    open,
    onClose,
    transferId,
    item,
}: UpdateFormProps) => {
    const { update } = useTransferItemMutations(transferId)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransferItemUpdateFormValues>({
        resolver: zodResolver(transferItemUpdateSchema),
        defaultValues: {
            quantity: item.quantity,
            notes: item.notes ?? '',
        },
    })

    const numberRegister = makeNumberRegister(register)

    useEffect(() => {
        if (open) {
            reset({
                quantity: item.quantity,
                notes: item.notes ?? '',
            })
        }
    }, [open, item, reset])

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    const onSubmit = async (values: TransferItemUpdateFormValues) => {
        try {
            await update.mutateAsync({
                itemId: item.id,
                data: {
                    quantity: values.quantity,
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
                            label="Cantidad"
                            invalid={!!errors.quantity}
                            errorMessage={errors.quantity?.message}
                        >
                            <Input
                                type="number"
                                min={1}
                                placeholder="1"
                                disabled={isSubmitting}
                                invalid={!!errors.quantity}
                                {...numberRegister('quantity', {
                                    integer: true,
                                    emptyValue: 1,
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

interface TransferItemFormProps {
    open: boolean
    onClose: () => void
    transferId: number
    item: TransferItem | null
}

const TransferItemForm = ({
    open,
    onClose,
    transferId,
    item,
}: TransferItemFormProps) =>
    item ? (
        <TransferItemUpdateForm
            open={open}
            transferId={transferId}
            item={item}
            onClose={onClose}
        />
    ) : (
        <TransferItemCreateForm
            open={open}
            transferId={transferId}
            onClose={onClose}
        />
    )

export default TransferItemForm
