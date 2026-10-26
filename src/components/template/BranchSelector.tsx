import { useQueryClient } from '@tanstack/react-query'
import { HiChevronDown, HiOutlineLocationMarker } from 'react-icons/hi'
import Dropdown from '@/components/ui/Dropdown'
import { useActiveBranch, useSession, useWorkplaceStore } from '@/stores'
import type { BranchSummary } from '@/@types/auth'

const branchLabel = (branch: BranchSummary) =>
    `${branch.establishmentCode} · ${branch.name}`

/**
 * La sucursal en la que se trabaja (encabezado `X-Branch-Id`). Solo ofrece
 * las sucursales a las que el usuario puede entrar; con una sola, la muestra
 * sin opciones.
 */
const BranchSelector = () => {
    const session = useSession()
    const branch = useActiveBranch()
    const selectBranch = useWorkplaceStore((s) => s.selectBranch)
    const queryClient = useQueryClient()

    if (!session || !branch) return null

    const content = (
        <>
            <HiOutlineLocationMarker className="text-lg text-gray-400" />
            <span className="hidden max-w-[12rem] truncate sm:inline">
                {branchLabel(branch)}
            </span>
        </>
    )

    if (session.branches.length === 1) {
        return (
            <div
                className="flex items-center gap-1.5 px-2 text-sm text-gray-600 dark:text-gray-300"
                title={`Sucursal ${branchLabel(branch)}`}
            >
                <span className="sr-only">Sucursal</span>
                {content}
            </div>
        )
    }

    const change = (branchId: number) => {
        if (branchId === branch.id) return
        selectBranch(session.tenant.id, branchId)
        // Turno, caja y ventas del POS son de la sucursal
        queryClient.removeQueries({ queryKey: ['pos'] })
    }

    return (
        <Dropdown
            aria-label={`Sucursal: ${branchLabel(branch)}`}
            placement="bottom-end"
            menuStyle={{ minWidth: 220 }}
            renderTitle={
                <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    {content}
                    <HiChevronDown className="text-gray-400" />
                </div>
            }
        >
            <Dropdown.Item variant="header">
                <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Sucursal
                </div>
            </Dropdown.Item>
            {session.branches.map((b) => (
                <Dropdown.Item
                    key={b.id}
                    eventKey={String(b.id)}
                    active={b.id === branch.id}
                    onClick={() => change(b.id)}
                >
                    {branchLabel(b)}
                </Dropdown.Item>
            ))}
        </Dropdown>
    )
}

export default BranchSelector
