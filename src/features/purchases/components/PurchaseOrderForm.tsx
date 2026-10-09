import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders'
import { SupplierSelect } from '@features/suppliers'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { dateToIsoStartOfDay } from '@shared/lib/dateToIsoStartOfDay'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    purchaseOrderSchema,
    type PurchaseOrderFormValues,
} from '../model/purchaseOrder.schema'

interface PurchaseOrderFormProps {
    open: boolean
    onClose: () => void
    onCreated?: (id: number) => void
}

const PurchaseOrderForm = ({
    open,
    onClose,
    onCreated,
}: PurchaseOrderFormProps) => {
    const createOrder = useCreatePurchaseOrder()
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderSchema),
        defaultValues: {
            supplierId: 0,
            notes: '',
            expectedDate: '',
        },
    })

    useEffect(() => {
        if (open) {
            reset({ supplierId: 0, notes: '', expectedDate: '' })
        }
    }, [open, reset])

    const isPending = createOrder.isPending || isSubmitting

    const handleClose = () => {
        if (!isPending) {
            onClose()
        }
    }

    const onSubmit = async (values: PurchaseOrderFormValues) => {
        try {
            const order = await createOrder.mutateAsync({
                supplierId: values.supplierId,
                notes: values.notes || undefined,
                expectedDate: dateToIsoStartOfDay(values.expectedDate),
            })

            notifySuccess(
                'Orden creada',
                'La orden de compra se creó correctamente'
            )

            onClose()
            if (onCreated) {
                onCreated(order.id)
            }
        } catch (error: unknown) {
            notifyError(error, 'Error al crear la orden de compra')
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
                <h5 className="mb-4">Nueva Orden de Compra</h5>

                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <FormContainer>
                        <FormItem
                            asterisk
                            label="Proveedor"
                            invalid={!!errors.supplierId}
                            errorMessage={errors.supplierId?.message}
                        >
                            <Controller
                                name="supplierId"
                                control={control}
                                render={({ field }) => (
                                    <SupplierSelect
                                        activeOnly
                                        inputId="supplierId"
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label="Fecha Esperada"
                            invalid={!!errors.expectedDate}
                            errorMessage={errors.expectedDate?.message}
                        >
                            <Input
                                type="date"
                                invalid={!!errors.expectedDate}
                                {...register('expectedDate')}
                            />
                        </FormItem>

                        <FormItem
                            label="Notas"
                            invalid={!!errors.notes}
                            errorMessage={errors.notes?.message}
                        >
                            <Input
                                textArea
                                placeholder="Observaciones de la orden"
                                invalid={!!errors.notes}
                                {...register('notes')}
                            />
                        </FormItem>
                    </FormContainer>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            disabled={isPending}
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isPending}
                        >
                            Crear
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default PurchaseOrderForm
