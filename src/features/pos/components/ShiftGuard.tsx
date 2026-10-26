import { useEffect, type ReactNode } from 'react'
import { useActiveShift } from '../hooks/usePOS'
import Spinner from '@/components/ui/Spinner'
import { notifyWarning } from '@shared/ui/notify'
import { isTerminalUnavailable, posErrorMessage } from '../model/errors'
import ShiftOpenDialog from './ShiftOpenDialog'
import { ShiftContext } from './useShift'
import { useTerminal } from './useTerminal'

interface ShiftGuardProps {
    children: ReactNode
}

/** El turno abierto de la caja; sin él, el formulario para abrirlo. */
const ShiftGuard = ({ children }: ShiftGuardProps) => {
    const { data: shift, isLoading, error } = useActiveShift()
    const { release } = useTerminal()
    const terminalUnavailable = isTerminalUnavailable(error)

    useEffect(() => {
        // La caja se desactivó (o cambió) después de validarla: elegir otra
        if (!terminalUnavailable) return
        notifyWarning(
            'Caja no disponible',
            posErrorMessage(error, 'Elige otra caja.')
        )
        release()
    }, [terminalUnavailable, error, release])

    if (isLoading || terminalUnavailable) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size={40} />
            </div>
        )
    }

    if (!shift) {
        return <ShiftOpenDialog />
    }

    return (
        <ShiftContext.Provider value={shift}>{children}</ShiftContext.Provider>
    )
}

export default ShiftGuard
