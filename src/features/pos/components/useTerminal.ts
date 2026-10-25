import { createContext, useContext } from 'react'
import type { BranchSummary } from '@/@types/auth'
import type { PosTerminal } from '../model/types'

/** Dónde corre el POS: la sucursal activa y la caja vinculada al navegador */
export interface TerminalPlacement {
    branch: BranchSummary
    terminal: PosTerminal
    /** Hay otra caja u otra sucursal a la que cambiar */
    canChange: boolean
    /** Vuelve a mostrar el selector de caja */
    change: () => void
    /** Desvincula la caja porque el backend ya no la acepta */
    release: () => void
}

export const TerminalContext = createContext<TerminalPlacement | null>(null)

export const useTerminal = (): TerminalPlacement => {
    const placement = useContext(TerminalContext)
    if (!placement) {
        throw new Error('useTerminal must be used within TerminalGuard')
    }
    return placement
}
