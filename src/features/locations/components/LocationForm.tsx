import Input from '@/components/ui/Input'
import { FormItem, FormContainer } from '@/components/ui/Form'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWarehousesList } from '@features/warehouses'
import {
    locationSchema,
    type LocationFormValues,
} from '../model/location.schema'
import {
    LOCATION_TYPES,
    LOCATION_TYPE_LABELS,
    type Location,
    type LocationType,
} from '../model/types'

interface LocationFormProps {
    formId: string
    location: Location | null
    isSubmitting?: boolean
    onSubmit: (data: LocationFormValues) => void
}

const locationTypeOptions: { value: LocationType; label: string }[] =
    LOCATION_TYPES.map((value) => ({
        value,
        label: LOCATION_TYPE_LABELS[value],
    }))

const LocationForm = ({
    formId,
    location,
    isSubmitting = false,
    onSubmit,
}: LocationFormProps) => {
    const { data: warehousesData } = useWarehousesList({ isActive: true })
    const warehouses = warehousesData?.items ?? []
    const warehouseOptions = warehouses.map((w) => ({
        value: w.id,
        label: w.name,
    }))

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<LocationFormValues>({
        resolver: zodResolver(locationSchema),
        defaultValues: location
            ? {
                  warehouseId: location.warehouseId,
                  name: location.name,
                  code: location.code,
                  type: location.type,
                  isActive: location.isActive,
                  capacity: location.capacity ?? null,
              }
            : {
                  name: '',
                  code: '',
                  type: 'storage',
                  isActive: true,
                  capacity: null,
              },
    })

    return (
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
            <FormContainer>
                <FormItem
                    asterisk
                    htmlFor="warehouseId"
                    label="Bodega"
                    invalid={!!errors.warehouseId}
                    errorMessage={errors.warehouseId?.message}
                >
                    <ControlledSelect
                        name="warehouseId"
                        control={control}
                        options={warehouseOptions}
                        isDisabled={isSubmitting}
                        placeholder="Seleccione una bodega"
                    />
                </FormItem>

                <div className="grid grid-cols-2 gap-4">
                    <FormItem
                        asterisk
                        htmlFor="name"
                        label="Nombre"
                        invalid={!!errors.name}
                        errorMessage={errors.name?.message}
                    >
                        <Input
                            id="name"
                            placeholder="Ej: Estante A1"
                            disabled={isSubmitting}
                            invalid={!!errors.name}
                            {...register('name')}
                        />
                    </FormItem>

                    <FormItem
                        asterisk
                        htmlFor="code"
                        label="Código"
                        invalid={!!errors.code}
                        errorMessage={errors.code?.message}
                    >
                        <Input
                            id="code"
                            placeholder="Ej: EST-A1"
                            disabled={isSubmitting}
                            invalid={!!errors.code}
                            {...register('code')}
                        />
                    </FormItem>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormItem
                        asterisk
                        htmlFor="type"
                        label="Tipo"
                        invalid={!!errors.type}
                        errorMessage={errors.type?.message}
                    >
                        <ControlledSelect
                            name="type"
                            control={control}
                            options={locationTypeOptions}
                            isDisabled={isSubmitting}
                            placeholder="Seleccione un tipo"
                        />
                    </FormItem>

                    <FormItem
                        htmlFor="capacity"
                        label="Capacidad"
                        invalid={!!errors.capacity}
                        errorMessage={errors.capacity?.message}
                    >
                        <Input
                            id="capacity"
                            type="number"
                            min={0}
                            placeholder="Ej: 100"
                            disabled={isSubmitting}
                            invalid={!!errors.capacity}
                            {...register('capacity', {
                                setValueAs: (v) => {
                                    if (
                                        v === '' ||
                                        v === null ||
                                        v === undefined
                                    )
                                        return null
                                    const parsed = parseInt(String(v), 10)
                                    return Number.isNaN(parsed) ? null : parsed
                                },
                            })}
                        />
                    </FormItem>
                </div>

                <div className="flex items-center gap-3">
                    <ControlledSwitcher name="isActive" control={control} />
                    <label htmlFor="isActive" className="text-sm font-medium">
                        Activo
                    </label>
                </div>
            </FormContainer>
        </form>
    )
}

export default LocationForm
