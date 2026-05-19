import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { FormItem } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    useAddPurchaseOrderItem,
    useUpdatePurchaseOrderItem,
} from '../hooks/usePurchaseOrders'
import { useProductsList } from '@features/products'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import { formatCurrency } from '@shared/lib/format'
import {
    purchaseOrderItemCreateSchema,
    purchaseOrderItemUpdateSchema,
    type PurchaseOrderItemCreateFormValues,
    type PurchaseOrderItemUpdateFormValues,
} from '../model/purchaseOrderItem.schema'
import type { PurchaseOrderItem } from '../model/types'

// ─── Create ───────────────────────────────────────────────────────────────────

interface CreateFormProps {
    open: boolean
    onClose: () => void
    orderId: number
}

const PurchaseOrderItemCreateForm = ({
    open,
    onClose,
    orderId,
}: CreateFormProps) => {
    const addItem = useAddPurchaseOrderItem()
    const { data: productsData } = useProductsList()
    const products = productsData?.items ?? []

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PurchaseOrderItemCreateFormValues>({
        resolver: zodResolver(purchaseOrderItemCreateSchema),
        defaultValues: {
            productId: undefined,
            quantityOrdered: 1,
            unitCost: 0,
        },
    })

    const numberRegister = makeNumberRegister(register)

    const [quantityOrdered, unitCost] = useWatch({
        control,
        name: ['quantityOrdered', 'unitCost'],
    })
    const subtotal = (quantityOrdered ?? 0) * (unitCost ?? 0)

    useEffect(() => {
        if (open) {
            reset({
                productId: undefined,
                quantityOrdered: 1,
                unitCost: 0,
            })
        }
    }, [open, orderId, reset])

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    const productOptions = products.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.sku})`,
    }))

    const onSubmit = async (values: PurchaseOrderItemCreateFormValues) => {
        try {
            await addItem.mutateAsync({
                purchaseOrderId: orderId,
                productId: values.productId,
                quantityOrdered: values.quantityOrdered,
                unitCost: values.unitCost,
            })
            toast.push(<Notification title="Item agregado" type="success" />, {
                placement: 'top-center',
            })
            onClose()
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al agregar el item')}
                </Notification>,
                { placement: 'top-center' }
            )
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
                            <ControlledSelect
                                name="productId"
                                control={control}
                                options={productOptions}
                                placeholder="Seleccionar producto"
                                isDisabled={isSubmitting}
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Cantidad"
                            invalid={!!errors.quantityOrdered}
                            errorMessage={errors.quantityOrdered?.message}
                        >
                            <Input
                                type="number"
                                min={1}
                                placeholder="1"
                                disabled={isSubmitting}
                                invalid={!!errors.quantityOrdered}
                                {...numberRegister('quantityOrdered', {
                                    integer: true,
                                    emptyValue: 1,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Costo Unitario"
                            invalid={!!errors.unitCost}
                            errorMessage={errors.unitCost?.message}
                        >
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                disabled={isSubmitting}
                                invalid={!!errors.unitCost}
                                {...numberRegister('unitCost', {
                                    emptyValue: 0,
                                })}
                            />
                        </FormItem>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500">Subtotal</p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(subtotal)}
                            </p>
                        </div>
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

// ─── Update ───────────────────────────────────────────────────────────────────

interface UpdateFormProps {
    open: boolean
    onClose: () => void
    orderId: number
    item: PurchaseOrderItem
}

const PurchaseOrderItemUpdateForm = ({
    open,
    onClose,
    orderId,
    item,
}: UpdateFormProps) => {
    const updateItem = useUpdatePurchaseOrderItem()

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PurchaseOrderItemUpdateFormValues>({
        resolver: zodResolver(purchaseOrderItemUpdateSchema),
        defaultValues: {
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
        },
    })

    const numberRegister = makeNumberRegister(register)

    const [quantityOrdered, unitCost] = useWatch({
        control,
        name: ['quantityOrdered', 'unitCost'],
    })
    const subtotal = (quantityOrdered ?? 0) * (unitCost ?? 0)

    useEffect(() => {
        if (open) {
            reset({
                quantityOrdered: item.quantityOrdered,
                unitCost: item.unitCost,
            })
        }
    }, [open, item, reset])

    const handleClose = () => {
        if (!isSubmitting) onClose()
    }

    const onSubmit = async (values: PurchaseOrderItemUpdateFormValues) => {
        try {
            await updateItem.mutateAsync({
                itemId: item.id,
                orderId,
                data: values,
            })
            toast.push(
                <Notification title="Item actualizado" type="success" />,
                { placement: 'top-center' }
            )
            onClose()
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al actualizar el item')}
                </Notification>,
                { placement: 'top-center' }
            )
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
                            invalid={!!errors.quantityOrdered}
                            errorMessage={errors.quantityOrdered?.message}
                        >
                            <Input
                                type="number"
                                min={1}
                                placeholder="1"
                                disabled={isSubmitting}
                                invalid={!!errors.quantityOrdered}
                                {...numberRegister('quantityOrdered', {
                                    integer: true,
                                    emptyValue: 1,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Costo Unitario"
                            invalid={!!errors.unitCost}
                            errorMessage={errors.unitCost?.message}
                        >
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                disabled={isSubmitting}
                                invalid={!!errors.unitCost}
                                {...numberRegister('unitCost', {
                                    emptyValue: 0,
                                })}
                            />
                        </FormItem>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500">Subtotal</p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(subtotal)}
                            </p>
                        </div>
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

// ─── Wrapper ──────────────────────────────────────────────────────────────────

interface PurchaseOrderItemFormProps {
    open: boolean
    onClose: () => void
    orderId: number
    item: PurchaseOrderItem | null
}

const PurchaseOrderItemForm = ({
    open,
    onClose,
    orderId,
    item,
}: PurchaseOrderItemFormProps) =>
    item ? (
        <PurchaseOrderItemUpdateForm
            open={open}
            orderId={orderId}
            item={item}
            onClose={onClose}
        />
    ) : (
        <PurchaseOrderItemCreateForm
            open={open}
            orderId={orderId}
            onClose={onClose}
        />
    )

export default PurchaseOrderItemForm
