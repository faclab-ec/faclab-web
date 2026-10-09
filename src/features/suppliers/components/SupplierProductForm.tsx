import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import { ControlledSwitcher } from '@/components/ui/Form/controlled'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { ProductSelect } from '@features/products'
import {
    supplierProductSchema,
    type SupplierProductFormValues,
} from '../model/supplierProduct.schema'
import { useSupplierProductMutations } from '../hooks/useSupplierProducts'
import type { SupplierProduct } from '../model/types'

interface SupplierProductFormProps {
    open: boolean
    onClose: () => void
    supplierId: number
    supplierProduct?: SupplierProduct | null
}

const SupplierProductForm = ({
    open,
    onClose,
    supplierId,
    supplierProduct,
}: SupplierProductFormProps) => {
    const { create, update } = useSupplierProductMutations(supplierId)
    const isEdit = !!supplierProduct

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SupplierProductFormValues>({
        resolver: zodResolver(supplierProductSchema),
        defaultValues: {
            productId: undefined,
            purchasePrice: undefined,
            supplierSku: '',
            minOrderQuantity: undefined,
            leadTimeDays: undefined,
            isPreferred: false,
        },
    })

    const numberRegister = makeNumberRegister(register)

    useEffect(() => {
        if (open) {
            reset(
                supplierProduct
                    ? {
                          productId: supplierProduct.productId,
                          purchasePrice: supplierProduct.purchasePrice,
                          supplierSku: supplierProduct.supplierSku ?? '',
                          minOrderQuantity:
                              supplierProduct.minOrderQuantity ?? undefined,
                          leadTimeDays:
                              supplierProduct.leadTimeDays ?? undefined,
                          isPreferred: supplierProduct.isPreferred,
                      }
                    : {
                          productId: undefined,
                          purchasePrice: undefined,
                          supplierSku: '',
                          minOrderQuantity: undefined,
                          leadTimeDays: undefined,
                          isPreferred: false,
                      }
            )
        }
    }, [supplierProduct, open, reset])

    const handleClose = () => {
        if (!isSubmitting) {
            reset()
            onClose()
        }
    }

    const onSubmit = async (values: SupplierProductFormValues) => {
        try {
            if (isEdit && supplierProduct) {
                await update.mutateAsync({
                    id: supplierProduct.id,
                    data: values,
                })
            } else {
                await create.mutateAsync(values)
            }
            notifySuccess(isEdit ? 'Producto actualizado' : 'Producto agregado')
            onClose()
        } catch (error: unknown) {
            notifyError(error, 'Error al guardar el producto del proveedor')
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
                    {isEdit
                        ? 'Editar Producto del Proveedor'
                        : 'Agregar Producto al Proveedor'}
                </h5>
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
                                        isDisabled={isEdit || isSubmitting}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            asterisk
                            label="Precio de Compra"
                            invalid={!!errors.purchasePrice}
                            errorMessage={errors.purchasePrice?.message}
                        >
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                disabled={isSubmitting}
                                invalid={!!errors.purchasePrice}
                                {...numberRegister('purchasePrice', {
                                    emptyValue: 0,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="SKU del Proveedor"
                            invalid={!!errors.supplierSku}
                            errorMessage={errors.supplierSku?.message}
                        >
                            <Input
                                type="text"
                                placeholder="Código del proveedor"
                                disabled={isSubmitting}
                                {...register('supplierSku')}
                            />
                        </FormItem>

                        <div className="grid grid-cols-2 gap-4">
                            <FormItem
                                label="Cantidad Mín. de Pedido"
                                invalid={!!errors.minOrderQuantity}
                                errorMessage={errors.minOrderQuantity?.message}
                            >
                                <Input
                                    type="number"
                                    placeholder="1"
                                    disabled={isSubmitting}
                                    invalid={!!errors.minOrderQuantity}
                                    {...numberRegister('minOrderQuantity', {
                                        integer: true,
                                    })}
                                />
                            </FormItem>

                            <FormItem
                                label="Tiempo de Entrega (días)"
                                invalid={!!errors.leadTimeDays}
                                errorMessage={errors.leadTimeDays?.message}
                            >
                                <Input
                                    type="number"
                                    placeholder="0"
                                    disabled={isSubmitting}
                                    invalid={!!errors.leadTimeDays}
                                    {...numberRegister('leadTimeDays', {
                                        integer: true,
                                    })}
                                />
                            </FormItem>
                        </div>

                        <div className="flex items-center gap-3">
                            <ControlledSwitcher
                                name="isPreferred"
                                control={control}
                            />
                            <label className="text-sm font-medium">
                                Proveedor preferido para este producto
                            </label>
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
                            {isEdit ? 'Actualizar' : 'Agregar'}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default SupplierProductForm
