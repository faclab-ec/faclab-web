import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BranchSummary, Session } from '@/@types/auth'
import { useAuthStore } from './useAuthStore'

/**
 * Dónde trabaja este navegador: la sucursal elegida en cada empresa y la caja
 * (terminal POS) vinculada en cada sucursal.
 *
 * Va en localStorage porque no es secreto y debe sobrevivir al cierre de
 * sesión: una caja queda vinculada a su computadora. Nunca se usa tal cual:
 * la sucursal se valida contra las de la sesión (`/me`) y la caja, contra las
 * terminales activas que devuelve el backend al abrir el POS.
 */
interface WorkplaceState {
    /** Sucursal elegida por empresa */
    branchByTenant: Record<string, number>
    /** Caja vinculada por empresa y sucursal (`terminalKey`) */
    terminalByBranch: Record<string, number>

    selectBranch: (tenantId: string, branchId: number) => void
    bindTerminal: (
        tenantId: string,
        branchId: number,
        terminalId: number
    ) => void
    unbindTerminal: (tenantId: string, branchId: number) => void
}

type PersistedWorkplace = Pick<
    WorkplaceState,
    'branchByTenant' | 'terminalByBranch'
>

const terminalKey = (tenantId: string, branchId: number) =>
    `${tenantId}:${branchId}`

export const useWorkplaceStore = create<WorkplaceState>()(
    persist(
        (set) => ({
            branchByTenant: {},
            terminalByBranch: {},

            selectBranch: (tenantId, branchId) =>
                set((s) => ({
                    branchByTenant: {
                        ...s.branchByTenant,
                        [tenantId]: branchId,
                    },
                })),

            bindTerminal: (tenantId, branchId, terminalId) =>
                set((s) => ({
                    terminalByBranch: {
                        ...s.terminalByBranch,
                        [terminalKey(tenantId, branchId)]: terminalId,
                    },
                })),

            unbindTerminal: (tenantId, branchId) =>
                set((s) => {
                    const terminalByBranch = { ...s.terminalByBranch }
                    delete terminalByBranch[terminalKey(tenantId, branchId)]
                    return { terminalByBranch }
                }),
        }),
        {
            name: 'fc.workplace',
            version: 1,
            partialize: ({
                branchByTenant,
                terminalByBranch,
            }): PersistedWorkplace => ({ branchByTenant, terminalByBranch }),
        }
    )
)

/**
 * La sucursal en la que trabaja la sesión: la elegida, si todavía puede
 * entrar en ella; si no, la matriz o la primera que tenga. Null si no puede
 * entrar a ninguna sucursal activa.
 */
export const activeBranch = (
    session: Session | null,
    branchByTenant: Record<string, number>
): BranchSummary | null => {
    if (!session) return null
    const { branches } = session
    const chosen = branchByTenant[session.tenant.id]
    return (
        branches.find((b) => b.id === chosen) ??
        branches.find((b) => b.isMain) ??
        branches[0] ??
        null
    )
}

/** La caja vinculada a una sucursal en este navegador (sin validar). */
export const boundTerminalId = (
    session: Session | null,
    branch: BranchSummary | null,
    terminalByBranch: Record<string, number>
): number | null =>
    session && branch
        ? terminalByBranch[terminalKey(session.tenant.id, branch.id)] ?? null
        : null

/** Sucursal y caja que viajan en los encabezados de faclab-core. */
export const currentPlacement = (): {
    branchId: number | null
    terminalId: number | null
} => {
    const session = useAuthStore.getState().session
    const { branchByTenant, terminalByBranch } = useWorkplaceStore.getState()
    const branch = activeBranch(session, branchByTenant)
    return {
        branchId: branch?.id ?? null,
        terminalId: boundTerminalId(session, branch, terminalByBranch),
    }
}

export const useActiveBranch = (): BranchSummary | null => {
    const session = useAuthStore((s) => s.session)
    const branchByTenant = useWorkplaceStore((s) => s.branchByTenant)
    return activeBranch(session, branchByTenant)
}

export const useBoundTerminalId = (): number | null => {
    const session = useAuthStore((s) => s.session)
    const branchByTenant = useWorkplaceStore((s) => s.branchByTenant)
    const terminalByBranch = useWorkplaceStore((s) => s.terminalByBranch)
    return boundTerminalId(
        session,
        activeBranch(session, branchByTenant),
        terminalByBranch
    )
}
