import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { EmptyState, ErrorState } from '@/components/shared'
import {
    useActiveBranch,
    useBoundTerminalId,
    useSession,
    useWorkplaceStore,
} from '@/stores'
import { notifyWarning } from '@shared/ui/notify'
import { usePosTerminals } from '../hooks/usePOS'
import TerminalPicker from './TerminalPicker'
import { TerminalContext } from './useTerminal'

const Centered = ({ children }: { children: ReactNode }) => (
    <div className="flex h-full items-center justify-center p-4">
        {children}
    </div>
)

/**
 * El POS corre en una caja: la vinculada a este navegador en la sucursal
 * activa (encabezados `X-Branch-Id` y `X-Terminal-Id`). Cada vez que se abre
 * el POS la vinculación se valida contra las cajas activas del backend; si
 * ya no está, se elige otra. Una sucursal con una sola caja la vincula sola.
 */
const TerminalGuard = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const session = useSession()
    const branch = useActiveBranch()
    const boundId = useBoundTerminalId()
    const selectBranch = useWorkplaceStore((s) => s.selectBranch)
    const bindTerminal = useWorkplaceStore((s) => s.bindTerminal)
    const unbindTerminal = useWorkplaceStore((s) => s.unbindTerminal)
    const [choosing, setChoosing] = useState(false)
    const terminalsQuery = usePosTerminals(branch?.id ?? null)

    const tenantId = session?.tenant.id
    const branchId = branch?.id
    const terminals = terminalsQuery.data
    // La lista que llegó del backend al abrir el POS, no la del caché
    const fresh =
        terminalsQuery.isFetchedAfterMount && !terminalsQuery.isFetching

    useEffect(() => {
        if (!fresh || !terminals || !tenantId || branchId === undefined) return
        if (boundId !== null && !terminals.some((t) => t.id === boundId)) {
            unbindTerminal(tenantId, branchId)
            notifyWarning(
                'Caja no disponible',
                'La caja de este navegador ya no está activa. Elige otra.'
            )
        } else if (boundId === null && terminals.length === 1 && !choosing) {
            bindTerminal(tenantId, branchId, terminals[0].id)
        }
    }, [
        fresh,
        terminals,
        boundId,
        tenantId,
        branchId,
        choosing,
        bindTerminal,
        unbindTerminal,
    ])

    if (!session || !branch) {
        return (
            <Centered>
                <EmptyState
                    icon={<HiOutlineLocationMarker />}
                    title="No tienes sucursales activas"
                    description="Pide a un administrador que te dé acceso a una sucursal."
                    action={
                        <Button onClick={() => navigate('/home')}>
                            Volver al inicio
                        </Button>
                    }
                />
            </Centered>
        )
    }

    if (terminalsQuery.isError) {
        return (
            <Centered>
                <ErrorState
                    title="No se pudieron cargar las cajas"
                    error={terminalsQuery.error}
                    onRetry={() => terminalsQuery.refetch()}
                />
            </Centered>
        )
    }

    const terminal = terminals?.find((t) => t.id === boundId) ?? null

    // Cargando, o validando la caja vinculada contra el backend
    if (!terminals || (boundId !== null && !terminal && !fresh)) {
        return (
            <Centered>
                <Spinner size={40} />
            </Centered>
        )
    }

    if (!terminal || choosing) {
        return (
            <TerminalPicker
                branch={branch}
                branches={session.branches}
                terminals={terminals}
                currentId={terminal?.id}
                onSelectBranch={(id) => selectBranch(session.tenant.id, id)}
                onSelect={(t) => {
                    bindTerminal(session.tenant.id, branch.id, t.id)
                    setChoosing(false)
                }}
                onCancel={choosing ? () => setChoosing(false) : undefined}
            />
        )
    }

    return (
        <TerminalContext.Provider
            value={{
                branch,
                terminal,
                canChange: session.branches.length > 1 || terminals.length > 1,
                change: () => setChoosing(true),
                release: () => {
                    unbindTerminal(session.tenant.id, branch.id)
                    queryClient.invalidateQueries({
                        queryKey: ['pos', 'terminals'],
                    })
                },
            }}
        >
            {children}
        </TerminalContext.Provider>
    )
}

export default TerminalGuard
