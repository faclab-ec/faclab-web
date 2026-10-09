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

const ShiftOpenDialog = () => {
    const navigate = useNavigate()
    const session = useSession()
    const openShift = useOpenShift()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ShiftOpenFormValues>({
        resolver: zodResolver(shiftOpenSchema),
        defaultValues: {
            cashierName: session?.username || '',
            openingBalance: 0,
            notes: '',
        },
    })

    const numberRegister = makeNumberRegister(register)

    const onSubmit = async (data: ShiftOpenFormValues) => {
        await openShift.mutateAsync({
            cashierName: data.cashierName,
            openingBalance: data.openingBalance,
            notes: data.notes || undefined,
        })
    }

    return (
        <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-6 text-center">
                    Abrir Turno
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Debe abrir un turno para usar el POS
                </p>
                {/* Doesn't block: sales go through, invoices wait */}
                <InvoicingReadinessAlert className="mb-6 text-sm" />

                <form onSubmit={handleSubmit(onSubmit)}>
                    <FormContainer>
                        <FormItem
                            asterisk
                            label="Nombre del cajero"
                            invalid={!!errors.cashierName}
                            errorMessage={errors.cashierName?.message}
                        >
                            <Input
                                placeholder="Nombre del cajero"
                                disabled={isSubmitting}
                                invalid={!!errors.cashierName}
                                {...register('cashierName')}
                            />
                        </FormItem>

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

                    <div className="flex gap-3 mt-8">
                        <Button
                            block
                            type="button"
                            variant="default"
                            onClick={() => navigate('/home')}
                        >
                            Volver al Dashboard
                        </Button>
                        <Button
                            block
                            type="submit"
                            variant="solid"
                            loading={openShift.isPending}
                        >
                            Abrir Turno
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ShiftOpenDialog
