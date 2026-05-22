import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { FormItem } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import { useAddCashMovement } from '../hooks/usePOS'
import { useShift } from './useShift'
import {
    cashMovementSchema,
    type CashMovementFormValues,
} from '../model/schemas'

interface CashMovementDialogProps {
    isOpen: boolean
    onClose: () => void
}

const CashMovementDialog = ({ isOpen, onClose }: CashMovementDialogProps) => {
    const shift = useShift()
    const addCashMovement = useAddCashMovement()

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CashMovementFormValues>({
        resolver: zodResolver(cashMovementSchema),
        defaultValues: {
            type: 'IN',
            amount: undefined,
            reason: '',
        },
    })

    const numberRegister = makeNumberRegister(register)
    const type = useWatch({ control, name: 'type' })

    const onSubmit = async (data: CashMovementFormValues) => {
        try {
            await addCashMovement.mutateAsync({
                shiftId: shift.id,
                data: {
                    type: data.type,
                    amount: data.amount,
                    reason: data.reason || undefined,
                },
            })
            notifySuccess('Movimiento registrado')
            reset()
            onClose()
        } catch (error: unknown) {
            notifyError(error, 'Error al registrar movimiento')
        }
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={400}
            overlayClassName="!z-[60]"
            onClose={handleClose}
        >
            <h4 className="text-lg font-bold mb-4">Movimiento de Caja</h4>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-2 mb-4">
                    <Button
                        block
                        type="button"
                        variant={type === 'IN' ? 'solid' : 'default'}
                        className={
                            type === 'IN'
                                ? '!bg-emerald-500 !border-emerald-500 text-white'
                                : ''
                        }
                        onClick={() => setValue('type', 'IN')}
                    >
                        Entrada
                    </Button>
                    <Button
                        block
                        type="button"
                        variant={type === 'OUT' ? 'solid' : 'default'}
                        className={
                            type === 'OUT'
                                ? '!bg-red-500 !border-red-500 text-white'
                                : ''
                        }
                        onClick={() => setValue('type', 'OUT')}
                    >
                        Salida
                    </Button>
                </div>

                <FormItem
                    asterisk
                    label="Monto"
                    invalid={!!errors.amount}
                    errorMessage={errors.amount?.message}
                >
                    <Input
                        type="number"
                        step="any"
                        prefix="$"
                        placeholder="0.00"
                        disabled={isSubmitting}
                        invalid={!!errors.amount}
                        {...numberRegister('amount')}
                    />
                </FormItem>

                <div className="mt-3">
                    <FormItem
                        label="Razón (opcional)"
                        invalid={!!errors.reason}
                        errorMessage={errors.reason?.message}
                    >
                        <Input
                            placeholder="Razón del movimiento"
                            disabled={isSubmitting}
                            invalid={!!errors.reason}
                            {...register('reason')}
                        />
                    </FormItem>
                </div>

                <div className="flex gap-2 mt-6">
                    <Button
                        block
                        type="button"
                        variant="default"
                        onClick={handleClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        block
                        type="submit"
                        variant="solid"
                        loading={addCashMovement.isPending}
                    >
                        Registrar
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export default CashMovementDialog
