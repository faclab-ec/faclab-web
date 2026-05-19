import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { useCloseShift, useCashSummary } from '../hooks/usePOS'
import { useShift } from './useShift'

interface ShiftCloseDialogProps {
    isOpen: boolean
    onClose: () => void
}

const SummaryRow = ({
    label,
    value,
    bold,
    positive,
    negative,
}: {
    label: string
    value: number
    bold?: boolean
    positive?: boolean
    negative?: boolean
}) => (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold' : ''}`}>
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span
            className={
                positive ? 'text-emerald-600' : negative ? 'text-red-500' : ''
            }
        >
            ${value.toFixed(2)}
        </span>
    </div>
)

const ShiftCloseDialog = ({ isOpen, onClose }: ShiftCloseDialogProps) => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const shift = useShift()
    const closeShift = useCloseShift()
    const { data: cashSummary, isLoading } = useCashSummary(shift.id)

    const [closingBalance, setClosingBalance] = useState<string>('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isOpen) {
            queryClient.invalidateQueries({
                queryKey: ['pos', 'cashSummary', shift.id],
            })
        }
    }, [isOpen, shift.id, queryClient])

    const closingNum = Number(closingBalance) || 0
    const discrepancy = cashSummary
        ? closingNum - cashSummary.expectedBalance
        : 0

    const handleClose = async () => {
        try {
            await closeShift.mutateAsync({
                shiftId: shift.id,
                data: {
                    closingBalance: closingNum,
                    notes: notes || undefined,
                },
            })
            notifySuccess('Turno cerrado')
            navigate('/home')
        } catch (error: unknown) {
            notifyError(error, 'Error al cerrar el turno')
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={500}
            overlayClassName="!z-[60]"
            onClose={onClose}
        >
            <h4 className="text-lg font-bold mb-4">Cerrar Turno</h4>

            {isLoading && (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            )}

            {cashSummary && (
                <div className="space-y-2 mb-6">
                    <SummaryRow
                        label="Saldo inicial"
                        value={cashSummary.openingBalance}
                    />
                    <SummaryRow
                        positive
                        label="Ventas en efectivo"
                        value={cashSummary.cashSales}
                    />
                    <SummaryRow
                        negative
                        label="Devoluciones en efectivo"
                        value={cashSummary.cashRefunds}
                    />
                    <SummaryRow
                        positive
                        label="Entradas de caja"
                        value={cashSummary.cashIn}
                    />
                    <SummaryRow
                        negative
                        label="Salidas de caja"
                        value={cashSummary.cashOut}
                    />
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <SummaryRow
                            bold
                            label="Saldo esperado"
                            value={cashSummary.expectedBalance}
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">
                    Saldo real en caja
                </label>
                <Input
                    type="number"
                    value={closingBalance}
                    prefix="$"
                    placeholder="0.00"
                    onChange={(e) => setClosingBalance(e.target.value)}
                />
            </div>

            {closingBalance !== '' && cashSummary && (
                <div
                    className={`mt-2 p-2 rounded text-center text-sm font-medium ${
                        discrepancy === 0
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600'
                    }`}
                >
                    Discrepancia: ${discrepancy.toFixed(2)}
                </div>
            )}

            <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                    Notas (opcional)
                </label>
                <Input
                    value={notes}
                    placeholder="Notas opcionales"
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className="flex gap-2 mt-6">
                <Button block variant="default" onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    block
                    variant="solid"
                    loading={closeShift.isPending}
                    onClick={handleClose}
                >
                    Cerrar Turno
                </Button>
            </div>
        </Dialog>
    )
}

export default ShiftCloseDialog
