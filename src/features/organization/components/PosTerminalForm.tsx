import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import { FormContainer, FormItem } from '@/components/ui/Form'
import {
    ControlledSelect,
    ControlledSwitcher,
} from '@/components/ui/Form/controlled'
import { useWarehousesList } from '@features/warehouses'
import { useLocationsList } from '@features/locations'
import { posTerminalSchema, type PosTerminalFormValues } from '../model/schemas'
import type { PosTerminalInput } from '../api/client'
import type { EmissionPoint, PosTerminal } from '../model/types'

interface PosTerminalFormProps {
    formId: string
    branchId: number
    terminal: PosTerminal | null
    /** Puntos de emisión de la sucursal */
    emissionPoints: EmissionPoint[]
    isSubmitting?: boolean
    onSubmit: (data: PosTerminalInput) => void
}

// Una ferretería tiene pocas bodegas y ubicaciones: se traen todas
const ALL = { limit: 1000 }

const PosTerminalForm = ({
    formId,
    branchId,
    terminal,
    emissionPoints,
    isSubmitting = false,
    onSubmit,
}: PosTerminalFormProps) => {
    const { data: warehouses } = useWarehousesList({ ...ALL, branchId })
    const { data: locations } = useLocationsList(ALL)

    const warehousesById = new Map(
        (warehouses?.items ?? []).map((w) => [w.id, w])
    )
    // La caja descuenta de una ubicación de una bodega de su sucursal
    const locationOptions = (locations?.items ?? [])
        .filter(
            (l) =>
                warehousesById.has(l.warehouseId) &&
                (l.isActive || l.id === terminal?.defaultLocationId)
        )
        .map((l) => ({
            value: l.id,
            label: `${warehousesById.get(l.warehouseId)?.code} › ${l.code} · ${
                l.name
            }`,
        }))
    const emissionPointOptions = emissionPoints
        .filter((p) => p.isActive || p.id === terminal?.emissionPointId)
        .map((p) => ({
            value: p.id,
            label: p.name ? `${p.code} · ${p.name}` : p.code,
        }))

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<PosTerminalFormValues>({
        resolver: zodResolver(posTerminalSchema),
        defaultValues: {
            code: terminal?.code ?? '',
            name: terminal?.name ?? '',
            // 0: sin elegir
            emissionPointId:
                terminal?.emissionPointId ??
                (emissionPointOptions.length === 1
                    ? emissionPointOptions[0].value
                    : 0),
            defaultLocationId: terminal?.defaultLocationId ?? 0,
            isActive: terminal?.isActive ?? true,
        },
    })

    return (
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
            <FormContainer>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[10rem_1fr]">
                    <FormItem
                        asterisk
                        htmlFor="terminal-code"
                        label="Código"
                        invalid={!!errors.code}
                        errorMessage={errors.code?.message}
                    >
                        <Input
                            id="terminal-code"
                            placeholder="CAJA-02"
                            disabled={isSubmitting}
                            invalid={!!errors.code}
                            {...register('code')}
                        />
                    </FormItem>
                    <FormItem
                        asterisk
                        htmlFor="terminal-name"
                        label="Nombre"
                        invalid={!!errors.name}
                        errorMessage={errors.name?.message}
                    >
                        <Input
                            id="terminal-name"
                            placeholder="Ej: Caja 2"
                            disabled={isSubmitting}
                            invalid={!!errors.name}
                            {...register('name')}
                        />
                    </FormItem>
                </div>
                <FormItem
                    asterisk
                    htmlFor="terminal-emissionPointId"
                    label="Punto de emisión"
                    invalid={!!errors.emissionPointId}
                    errorMessage={errors.emissionPointId?.message}
                >
                    <ControlledSelect
                        name="emissionPointId"
                        control={control}
                        placeholder="Por dónde factura la caja"
                        options={emissionPointOptions}
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem
                    asterisk
                    htmlFor="terminal-defaultLocationId"
                    label="Ubicación de stock"
                    invalid={!!errors.defaultLocationId}
                    errorMessage={errors.defaultLocationId?.message}
                >
                    <ControlledSelect
                        name="defaultLocationId"
                        control={control}
                        placeholder="De dónde descuenta lo que vende"
                        options={locationOptions}
                        noOptionsMessage={() =>
                            'La sucursal no tiene bodegas con ubicaciones'
                        }
                        isDisabled={isSubmitting}
                    />
                </FormItem>
                <FormItem htmlFor="terminal-isActive" label="Activa">
                    <ControlledSwitcher
                        name="isActive"
                        control={control}
                        disabled={isSubmitting}
                    />
                </FormItem>
            </FormContainer>
        </form>
    )
}

export default PosTerminalForm
