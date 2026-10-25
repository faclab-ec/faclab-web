import type {
    Branch,
    EmissionPoint,
    PosTerminal,
} from '@/features/organization/model/types'
import type { Location } from '@/features/locations/model/types'
import type { Warehouse } from '@/features/warehouses/model/types'
import {
    ADMIN,
    apiError,
    created,
    ok,
    paginated,
    type MockApi,
} from '../support/mockApi'

export const buildBranch = (overrides: Partial<Branch> = {}): Branch => ({
    id: 1,
    establishmentCode: '001',
    name: 'Matriz',
    address: 'Av. Loja 1-23, Cuenca',
    isMain: true,
    isActive: true,
    ...overrides,
})

export const buildEmissionPoint = (
    overrides: Partial<EmissionPoint> = {}
): EmissionPoint => ({
    id: 1,
    branchId: 1,
    code: '001',
    name: null,
    isActive: true,
    ...overrides,
})

export const buildTerminal = (
    overrides: Partial<PosTerminal> = {}
): PosTerminal => ({
    id: 11,
    branchId: 1,
    emissionPointId: 1,
    defaultLocationId: 1,
    code: 'CAJA-01',
    name: 'Caja 1',
    isActive: true,
    ...overrides,
})

/** Una bodega por sucursal, con su almacén principal */
const warehouseOf = (branch: Branch): Warehouse => ({
    id: branch.id,
    branchId: branch.id,
    name: `Bodega ${branch.name}`,
    code: `BOD-${branch.establishmentCode}`,
    isActive: true,
    isDefault: branch.isMain,
})

const locationOf = (warehouse: Warehouse): Location => ({
    id: warehouse.id * 10,
    warehouseId: warehouse.id,
    name: 'Almacén principal',
    code: 'A1',
    type: 'storage',
    isActive: true,
})

const notFound = () => apiError(404, 'NOT_FOUND', 'Not found')

const byBranch = <T extends { branchId: number }>(
    rows: T[],
    query: URLSearchParams
) => {
    const branchId = query.get('branchId')
    return branchId ? rows.filter((r) => r.branchId === Number(branchId)) : rows
}

/**
 * Sucursales, puntos de emisión y cajas con estado en memoria, más una bodega
 * con su ubicación por sucursal (para el formulario de cajas).
 */
export const mockOrganization = (
    api: MockApi,
    seed: {
        branches?: Branch[]
        emissionPoints?: EmissionPoint[]
        terminals?: PosTerminal[]
    } = {}
) => {
    const branches = [...(seed.branches ?? [buildBranch()])]
    const emissionPoints = [...(seed.emissionPoints ?? [buildEmissionPoint()])]
    const terminals = [...(seed.terminals ?? [buildTerminal()])]
    const nextId = (rows: { id: number }[]) =>
        Math.max(0, ...rows.map((r) => r.id)) + 1

    api.get(`${ADMIN}/branches`, ({ query }) => paginated(branches, query))
    api.get(`${ADMIN}/branches/:id`, ({ params }) => {
        const branch = branches.find((b) => b.id === Number(params.id))
        return branch ? ok(branch) : notFound()
    })
    api.post(`${ADMIN}/branches`, ({ body }) => {
        const branch: Branch = {
            ...(body as Omit<Branch, 'id' | 'isMain'>),
            id: nextId(branches),
            isMain: false,
        }
        branches.push(branch)
        return created(branch)
    })

    api.get(`${ADMIN}/emission-points`, ({ query }) =>
        paginated(byBranch(emissionPoints, query), query)
    )
    api.post(`${ADMIN}/emission-points`, ({ body }) => {
        const point: EmissionPoint = {
            ...(body as Omit<EmissionPoint, 'id'>),
            id: nextId(emissionPoints),
        }
        emissionPoints.push(point)
        return created(point)
    })

    api.get(`${ADMIN}/pos-terminals`, ({ query }) =>
        paginated(byBranch(terminals, query), query)
    )
    api.post(`${ADMIN}/pos-terminals`, ({ body }) => {
        const terminal: PosTerminal = {
            ...(body as Omit<PosTerminal, 'id'>),
            id: nextId(terminals),
        }
        terminals.push(terminal)
        return created(terminal)
    })

    api.get(`${ADMIN}/warehouses`, ({ query }) =>
        paginated(byBranch(branches.map(warehouseOf), query), query)
    )
    api.get(`${ADMIN}/locations`, ({ query }) =>
        paginated(branches.map(warehouseOf).map(locationOf), query)
    )

    return { branches, emissionPoints, terminals }
}
