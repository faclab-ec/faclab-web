import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import { useOpenShift } from '../hooks/usePOS'
import { useSession } from '@/stores/useAuthStore'
import { InvoicingReadinessAlert } from '@features/invoicing'
import { shiftOpenSchema, type ShiftOpenFormValues } from '../model/schemas'
import { notifyError } from '@shared/ui/notify'

const ShiftOpenDialog = () => {
    const navigate = useNavigate()
    const session = useSession()
    const openShift = useOpenShift()
    // El backend firma el turno con el usuario autenticado
    const cashierName = session?.fullName || session?.username

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ShiftOpenFormValues>({
        resolver: zodResolver(shiftOpenSchema),
        defaultValues: {
            openingBalance: 0,
            notes: '',
        },
    })

    const numberRegister = makeNumberRegister(register)

    const onSubmit = async (data: ShiftOpenFormValues) => {
        try {
            await openShift.mutateAsync({
                openingBalance: data.openingBalance,
                notes: data.notes || undefined,
            })
        } catch (error: unknown) {
            notifyError(error, 'No se pudo abrir el turno')
        }
    }

    return (
        <div className="flex h-full items-center justify-center overflow-y-auto p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-pop dark:border-gray-700 dark:bg-gray-800 sm:p-8">
                <h1 className="mb-1 text-center text-xl">Abrir turno</h1>
                <p className="mb-6 text-center text-gray-500 dark:text-gray-400">
                    Debes abrir un turno para usar el punto de venta
                </p>
                {/* Doesn't block: sales go through, invoices wait */}
                <InvoicingReadinessAlert className="mb-6 text-sm" />

                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormContainer>
                        {cashierName && (
                            <p className="mb-6 text-gray-500 dark:text-gray-400">
                                Cajero:{' '}
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {cashierName}
                                </span>
                            </p>
                        )}

                        <FormItem
                            asterisk
                            label="Saldo inicial"
                            invalid={!!errors.openingBalance}
                            errorMessage={errors.openingBalance?.message}
                        >
                            <Input
                                type="number"
                                step="any"
                                prefix="$"
                                disabled={isSubmitting}
                                invalid={!!errors.openingBalance}
                                {...numberRegister('openingBalance', {
                                    emptyValue: 0,
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="Notas (opcional)"
                            invalid={!!errors.notes}
                            errorMessage={errors.notes?.message}
                        >
                            <Input
                                placeholder="Notas opcionales"
                                disabled={isSubmitting}
                                invalid={!!errors.notes}
                                {...register('notes')}
                            />
                        </FormItem>
                    </FormContainer>

                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                        <Button
                            block
                            type="button"
                            variant="default"
                            onClick={() => navigate('/home')}
                        >
                            Volver al inicio
                        </Button>
                        <Button
                            block
                            type="submit"
                            variant="solid"
                            loading={openShift.isPending}
                        >
                            Abrir turno
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ShiftOpenDialog
