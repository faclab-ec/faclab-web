import type { BranchSummary } from '@/@types/auth'

export const branchLabel = (
    branches: BranchSummary[],
    branchId: number
): string => {
    const branch = branches.find((b) => b.id === branchId)
    return branch
        ? `${branch.establishmentCode} · ${branch.name}`
        : `Sucursal #${branchId}`
}

/**
 * Las sucursales a las que el usuario puede entrar, más la de la bodega que
 * se edita aunque ya no esté entre ellas (inactiva o sin acceso).
 */
export const branchOptions = (
    branches: BranchSummary[],
    currentId?: number
): { value: number; label: string }[] => {
    const options = branches.map((b) => ({
        value: b.id,
        label: branchLabel(branches, b.id),
    }))
    if (currentId && !branches.some((b) => b.id === currentId)) {
        options.push({
            value: currentId,
            label: branchLabel(branches, currentId),
        })
    }
    return options
}
