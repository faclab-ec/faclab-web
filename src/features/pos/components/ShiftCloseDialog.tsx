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
import LabeledField from '@/components/shared/LabeledField'
import { formatCurrency } from '@shared/lib/format'
import { POS_PAYMENT_METHOD_LABELS } from '../model/types'
import { POS_ERROR_MESSAGES } from '../model/errors'
import {
    countDifference,
    countIsComplete,
    countRows,
    needsJustification,
    toCloseInput,
    type CountRow,
} from '../lib/shiftCount'

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
            {formatCurrency(value)}
        </span>
    </div>
)

const differenceClass = (difference: number | null) =>
    difference === null || difference === 0
        ? 'text-gray-500 dark:text-gray-400'
        : difference > 0
        ? 'text-emerald-600'
        : 'text-red-500'

/**
 * Cierre del turno con arqueo (S5.9): el cajero cuenta el efectivo y cada medio
 * de pago que el turno movió; una diferencia mayor que el umbral pide su
 * justificación. Al cerrar, faclab-core guarda el cierre Z numerado.
 */
const ShiftCloseDialog = ({ isOpen, onClose }: ShiftCloseDialogProps) => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const shift = useShift()
    const closeShift = useCloseShift()
    const { data: cashSummary, isLoading } = useCashSummary(shift.id)

    // What the cashier typed, by method; the rows come from the summary
    const [entries, setEntries] = useState<
        Partial<Record<string, Pick<CountRow, 'counted' | 'justification'>>>
    >({})
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isOpen) {
            queryClient.invalidateQueries({
                queryKey: ['pos', 'cashSummary', shift.id],
            })
        }
    }, [isOpen, shift.id, queryClient])

    const rows: CountRow[] = cashSummary
        ? countRows(cashSummary).map((row) => ({
              ...row,
              ...entries[row.paymentMethod],
          }))
        : []
    const threshold = cashSummary?.justificationThreshold ?? 0
    const complete = rows.length > 0 && countIsComplete(rows, threshold)

    const updateRow = (
        row: CountRow,
        change: Partial<Pick<CountRow, 'counted' | 'justification'>>
    ) =>
        setEntries((current) => ({
            ...current,
            [row.paymentMethod]: {
                counted: row.counted,
                justification: row.justification,
                ...change,
            },
        }))

    const handleClose = async () => {
        try {
            const closed = await closeShift.mutateAsync({
                shiftId: shift.id,
                data: toCloseInput(rows, notes),
            })
            notifySuccess(
                'Turno cerrado',
                closed.closingNumber
                    ? `Cierre ${closed.closingNumber}`
                    : undefined
            )
            navigate('/home')
        } catch (error: unknown) {
            notifyError(error, 'Error al cerrar el turno', {
                messages: POS_ERROR_MESSAGES,
            })
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            contentLabel="Cerrar turno"
            width={640}
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
                        label="Abonos en efectivo"
                        value={cashSummary.customerPayments}
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
                            label="Efectivo esperado"
                            value={cashSummary.expectedBalance}
                        />
                    </div>
                </div>
            )}

            {rows.length > 0 && (
                <div className="mb-4">
                    <h5 className="mb-1">Arqueo</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Cuenta el efectivo y los comprobantes de cada medio. Una
                        diferencia mayor que {formatCurrency(threshold)}{' '}
                        necesita justificación.
                    </p>
                    <div className="space-y-3">
                        {rows.map((row) => {
                            const label =
                                POS_PAYMENT_METHOD_LABELS[row.paymentMethod]
                            const difference = countDifference(row)
                            const justify = needsJustification(row, threshold)
                            return (
                                <div
                                    key={row.paymentMethod}
                                    data-testid={`count-${row.paymentMethod}`}
                                    className="rounded border border-gray-200 dark:border-gray-700 p-3"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                        <div className="text-sm">
                                            <div className="font-semibold">
                                                {label}
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400">
                                                Esperado{' '}
                                                {formatCurrency(row.expected)}
                                            </div>
                                        </div>
                                        <LabeledField
                                            label={`${label} contado`}
                                        >
                                            <Input
                                                type="number"
                                                step="any"
                                                min={0}
                                                size="sm"
                                                prefix="$"
                                                placeholder="0.00"
                                                value={row.counted}
                                                onChange={(e) =>
                                                    updateRow(row, {
                                                        counted: e.target.value,
                                                    })
                                                }
                                            />
                                        </LabeledField>
                                        <div
                                            className={`text-sm font-medium sm:text-right ${differenceClass(
                                                difference
                                            )}`}
                                        >
                                            Diferencia{' '}
                                            {difference === null
                                                ? '-'
                                                : formatCurrency(difference)}
                                        </div>
                                    </div>
                                    {justify && (
                                        <LabeledField
                                            label={`Justificación de ${label.toLowerCase()}`}
                                            className="mt-3"
                                        >
                                            <Input
                                                size="sm"
                                                maxLength={512}
                                                placeholder="Por qué no cuadra"
                                                value={row.justification}
                                                onChange={(e) =>
                                                    updateRow(row, {
                                                        justification:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </LabeledField>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <LabeledField label="Notas (opcional)" className="mt-4">
                <Input
                    value={notes}
                    maxLength={512}
                    placeholder="Notas opcionales"
                    onChange={(e) => setNotes(e.target.value)}
                />
            </LabeledField>

            <div className="flex gap-2 mt-6">
                <Button block variant="default" onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    block
                    variant="solid"
                    disabled={!complete}
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
