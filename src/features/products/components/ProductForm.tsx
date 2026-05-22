import Input from '@/components/ui/Input'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCategoriesList } from '@features/categories'
import { useUnitsOfMeasureList } from '@features/unitsOfMeasure'
import { productSchema, type ProductFormValues } from '../model/product.schema'
import type { Product } from '../model/types'

interface ProductFormProps {
    formId: string
    product?: Product | null
    isSubmitting?: boolean
    onSubmit: (data: ProductFormValues) => void
}

const emptyValues: ProductFormValues = {
    name: '',
    sku: '',
    description: '',
    barcode: '',
    categoryId: undefined,
    unitOfMeasureId: undefined,
    purchasePrice: undefined,
    salePrice: undefined,
    isActive: true,
    isService: false,
    minStock: 0,
    maxStock: undefined,
    reorderPoint: 0,
    leadTimeDays: undefined,
}

export const ProductForm = ({
    formId,
    product,
    isSubmitting = false,
    onSubmit,
}: ProductFormProps) => {
    const { data: categoriesData } = useCategoriesList()
    const categories = categoriesData?.items ?? []
    const { data: unitsData } = useUnitsOfMeasureList()
    const unitsOfMeasure = unitsData?.items ?? []

    const categoryOptions = [
        { value: undefined, label: 'Sin categoría' },
        ...categories.map((cat) => ({
            value: cat.id as number | undefined,
            label: cat.name,
        })),
    ]

    const unitOptions = [
        { value: undefined, label: 'Sin unidad' },
        ...unitsOfMeasure
            .filter((u) => u.isActive)
            .map((u) => ({
                value: u.id as number | undefined,
                label: `${u.name} (${u.symbol})`,
            })),
    ]

    const defaultValues: ProductFormValues = product
        ? {
              name: product.name,
              sku: product.sku,
              description: product.description || '',
              barcode: product.barcode || '',
              categoryId: product.categoryId ?? undefined,
              unitOfMeasureId: product.unitOfMeasureId ?? undefined,
              purchasePrice: product.purchasePrice ?? undefined,
              salePrice: product.salePrice ?? undefined,
              isActive: product.isActive,
              isService: product.isService,
              minStock: product.minStock,
              maxStock: product.maxStock ?? undefined,
              reorderPoint: product.reorderPoint,
              leadTimeDays: product.leadTimeDays ?? undefined,
          }
        : emptyValues

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues,
    })

    const numberRegister = makeNumberRegister(register)

    return (
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
            <FormContainer>
                <FormItem
                    asterisk
                    htmlFor="name"
                    label="Nombre"
                    invalid={!!errors.name}
                    errorMessage={errors.name?.message}
                >
                    <Input
                        id="name"
                        placeholder="Nombre del producto"
                        disabled={isSubmitting}
                        invalid={!!errors.name}
                        {...register('name')}
                    />
                </FormItem>

                <FormItem
                    asterisk
                    htmlFor="sku"
                    label="SKU"
                    invalid={!!errors.sku}
                    errorMessage={errors.sku?.message}
                >
                    <Input
                        id="sku"
                        placeholder="SKU del producto"
                        disabled={isSubmitting}
                        invalid={!!errors.sku}
                        {...register('sku')}
                    />
                </FormItem>

                <FormItem
                    htmlFor="description"
                    label="Descripción"
                    invalid={!!errors.description}
                    errorMessage={errors.description?.message}
                >
                    <Input
                        textArea
                        id="description"
                        placeholder="Descripción del producto"
                        style={{ minHeight: '80px' }}
                        disabled={isSubmitting}
                        invalid={!!errors.description}
                        {...register('description')}
                    />
                </FormItem>

                <FormItem
                    htmlFor="barcode"
                    label="Código de barras"
                    invalid={!!errors.barcode}
                    errorMessage={errors.barcode?.message}
                >
                    <Input
                        id="barcode"
                        placeholder="Ej: 7501234567890"
                        disabled={isSubmitting}
                        invalid={!!errors.barcode}
                        {...register('barcode')}
                    />
                </FormItem>

                <FormItem
                    htmlFor="categoryId"
                    label="Categoría"
                    invalid={!!errors.categoryId}
                    errorMessage={errors.categoryId?.message}
                    extra={
                        <span className="text-xs text-gray-500 ml-2">
                            Opcional
                        </span>
                    }
                >
                    <ControlledSelect
                        name="categoryId"
                        control={control}
                        options={categoryOptions}
                        isDisabled={isSubmitting}
                        placeholder="Seleccione una categoría"
                    />
                </FormItem>

                <FormItem
                    htmlFor="unitOfMeasureId"
                    label="Unidad de Medida"
                    invalid={!!errors.unitOfMeasureId}
                    errorMessage={errors.unitOfMeasureId?.message}
                    extra={
                        <span className="text-xs text-gray-500 ml-2">
                            Opcional
                        </span>
                    }
                >
                    <ControlledSelect
                        name="unitOfMeasureId"
                        control={control}
                        options={unitOptions}
                        isDisabled={isSubmitting}
                        placeholder="Seleccione una unidad"
                    />
                </FormItem>

                <div className="grid grid-cols-2 gap-4">
                    <FormItem
                        htmlFor="purchasePrice"
                        label="Precio de compra"
                        invalid={!!errors.purchasePrice}
                        errorMessage={errors.purchasePrice?.message}
                    >
                        <Input
                            id="purchasePrice"
                            type="number"
                            step="any"
                            placeholder="0.00"
                            disabled={isSubmitting}
                            invalid={!!errors.purchasePrice}
                            {...numberRegister('purchasePrice')}
                        />
                    </FormItem>
                    <FormItem
                        htmlFor="salePrice"
                        label="Precio de venta"
                        invalid={!!errors.salePrice}
                        errorMessage={errors.salePrice?.message}
                    >
                        <Input
                            id="salePrice"
                            type="number"
                            step="any"
                            placeholder="0.00"
                            disabled={isSubmitting}
                            invalid={!!errors.salePrice}
                            {...numberRegister('salePrice')}
                        />
                    </FormItem>
                </div>

                <div className="flex gap-6">
                    <div className="flex items-center gap-3">
                        <ControlledSwitcher name="isActive" control={control} />
                        <label
                            htmlFor="isActive"
                            className="text-sm font-medium"
                        >
                            Activo
                        </label>
                    </div>
                    <div className="flex items-center gap-3">
                        <ControlledSwitcher
                            name="isService"
                            control={control}
                        />
                        <label
                            htmlFor="isService"
                            className="text-sm font-medium"
                        >
                            Es servicio
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormItem
                        htmlFor="minStock"
                        label="Stock mínimo"
                        invalid={!!errors.minStock}
                        errorMessage={errors.minStock?.message}
                    >
                        <Input
                            id="minStock"
                            type="number"
                            placeholder="0"
                            disabled={isSubmitting}
                            invalid={!!errors.minStock}
                            {...numberRegister('minStock', {
                                integer: true,
                                emptyValue: 0,
                            })}
                        />
                    </FormItem>
                    <FormItem
                        htmlFor="maxStock"
                        label="Stock máximo"
                        invalid={!!errors.maxStock}
                        errorMessage={errors.maxStock?.message}
                    >
                        <Input
                            id="maxStock"
                            type="number"
                            placeholder="Sin límite"
                            disabled={isSubmitting}
                            invalid={!!errors.maxStock}
                            {...numberRegister('maxStock', { integer: true })}
                        />
                    </FormItem>
                    <FormItem
                        htmlFor="reorderPoint"
                        label="Punto de reorden"
                        invalid={!!errors.reorderPoint}
                        errorMessage={errors.reorderPoint?.message}
                    >
                        <Input
                            id="reorderPoint"
                            type="number"
                            placeholder="0"
                            disabled={isSubmitting}
                            invalid={!!errors.reorderPoint}
                            {...numberRegister('reorderPoint', {
                                integer: true,
                                emptyValue: 0,
                            })}
                        />
                    </FormItem>
                    <FormItem
                        htmlFor="leadTimeDays"
                        label="Tiempo de entrega (días)"
                        invalid={!!errors.leadTimeDays}
                        errorMessage={errors.leadTimeDays?.message}
                    >
                        <Input
                            id="leadTimeDays"
                            type="number"
                            placeholder="Sin definir"
                            disabled={isSubmitting}
                            invalid={!!errors.leadTimeDays}
                            {...numberRegister('leadTimeDays', {
                                integer: true,
                            })}
                        />
                    </FormItem>
                </div>
            </FormContainer>
        </form>
    )
}
