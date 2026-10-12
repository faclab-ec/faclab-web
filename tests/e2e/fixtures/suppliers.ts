import type { Supplier } from '@/features/suppliers/model/types'
import type { SupplierFormValues } from '@/features/suppliers/model/supplier.schema'
import {
    ADMIN,
    apiError,
    created,
    noContent,
    ok,
    paginated,
    type MockApi,
} from '../support/mockApi'

export const buildSupplier = (overrides: Partial<Supplier> = {}): Supplier => ({
    id: 1,
    name: 'Maderas del Austro',
    taxId: '0190123456001',
    taxType: 1,
    email: 'ventas@maderasaustro.ec',
    phone: '072845100',
    address: 'Av. de las Américas 12-34',
    city: 'Cuenca',
    country: 'Ecuador',
    paymentTerms: 30,
    leadTimeDays: 7,
    notes: null,
    isActive: true,
    ...overrides,
})

export const supplierList = (): Supplier[] => [
    buildSupplier(),
    buildSupplier({
        id: 2,
        name: 'Herrajes Andinos',
        taxId: '1790987654001',
        email: 'contacto@herrajesandinos.ec',
        phone: '022456789',
        city: 'Quito',
    }),
    buildSupplier({
        id: 3,
        name: 'Tableros del Pacífico',
        taxId: '0992345678001',
        email: null,
        phone: null,
        city: 'Guayaquil',
        isActive: false,
    }),
]

const notFound = () => apiError(404, 'NOT_FOUND', 'Proveedor no encontrado')

/**
 * Proveedores con estado en memoria: lo que la prueba crea, edita o elimina
 * se refleja en las consultas siguientes, como en el backend real.
 */
export const mockSuppliers = (
    api: MockApi,
    seed: Supplier[] = supplierList()
): Supplier[] => {
    const rows = [...seed]
    const find = (id: string) => rows.find((row) => row.id === Number(id))

    api.get(`${ADMIN}/suppliers`, ({ query }) => {
        const search = query.get('search')?.toLowerCase()
        const matches = search
            ? rows.filter(
                  (row) =>
                      row.name.toLowerCase().includes(search) ||
                      row.taxId.includes(search)
              )
            : rows
        return paginated(matches, query)
    })

    api.get(`${ADMIN}/suppliers/:id`, ({ params }) => {
        const supplier = find(params.id)
        return supplier ? ok(supplier) : notFound()
    })

    // Pestañas del detalle
    api.get(`${ADMIN}/suppliers/:id/contacts`, () => ok([]))
    api.get(`${ADMIN}/suppliers/:id/products`, () => ok([]))

    api.post(`${ADMIN}/suppliers`, ({ body }) => {
        const input = body as SupplierFormValues
        const supplier: Supplier = {
            isActive: true,
            ...input,
            id: Math.max(0, ...rows.map((row) => row.id)) + 1,
        }
        rows.unshift(supplier)
        return created(supplier)
    })

    api.put(`${ADMIN}/suppliers/:id`, ({ params, body }) => {
        const supplier = find(params.id)
        if (!supplier) return notFound()
        Object.assign(supplier, body as SupplierFormValues)
        return ok(supplier)
    })

    api.delete(`${ADMIN}/suppliers/:id`, ({ params }) => {
        const index = rows.findIndex((row) => row.id === Number(params.id))
        if (index === -1) return notFound()
        rows.splice(index, 1)
        return noContent()
    })

    const setActive =
        (isActive: boolean) =>
        (request: { params: Record<string, string> }) => {
            const supplier = find(request.params.id)
            if (!supplier) return notFound()
            supplier.isActive = isActive
            return ok(supplier)
        }
    api.post(`${ADMIN}/suppliers/:id/activate`, setActive(true))
    api.post(`${ADMIN}/suppliers/:id/deactivate`, setActive(false))

    return rows
}
