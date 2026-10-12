import type { Category } from '@/features/categories/model/types'
import type { Product } from '@/features/products/model/types'
import type { UnitOfMeasure } from '@/features/unitsOfMeasure/model/types'
import { ADMIN, created, ok, paginated, type MockApi } from '../support/mockApi'

export const categories = (): Category[] => [
    { id: 1, name: 'Tableros', description: 'MDF, melamina y aglomerado' },
    { id: 2, name: 'Herrajes', description: null },
]

export const unitsOfMeasure = (): UnitOfMeasure[] => [
    { id: 1, name: 'Unidad', symbol: 'u', isActive: true },
    { id: 2, name: 'Metro', symbol: 'm', isActive: true },
]

export const buildProduct = (overrides: Partial<Product> = {}): Product => ({
    id: 1,
    name: 'Tablero MDF 15mm',
    sku: 'TAB-MDF-15',
    description: null,
    barcode: '7861234567890',
    categoryId: 1,
    unitOfMeasureId: 1,
    purchasePrice: 9.5,
    salePrice: 12.5,
    taxCode: 'VAT_15',
    isActive: true,
    isService: false,
    minStock: 10,
    maxStock: 200,
    reorderPoint: 25,
    leadTimeDays: 5,
    ...overrides,
})

export const productList = (): Product[] => [
    buildProduct(),
    buildProduct({
        id: 2,
        name: 'Bisagra cazoleta 35mm',
        sku: 'HER-BIS-35',
        barcode: null,
        categoryId: 2,
        purchasePrice: 0.6,
        salePrice: 0.95,
    }),
    buildProduct({
        id: 3,
        name: 'Servicio de corte',
        sku: 'SRV-CORTE',
        barcode: null,
        categoryId: null,
        isService: true,
        isActive: false,
        salePrice: 3,
    }),
]

/** Catálogo con estado en memoria para las pruebas de productos. */
export const mockCatalog = (
    api: MockApi,
    seed: Product[] = productList()
): Product[] => {
    const rows = [...seed]

    api.get(`${ADMIN}/categories`, ({ query }) =>
        paginated(categories(), query)
    )
    api.get(`${ADMIN}/units-of-measure`, ({ query }) =>
        paginated(unitsOfMeasure(), query)
    )
    api.get(`${ADMIN}/products`, ({ query }) => {
        const search = query.get('search')?.toLowerCase()
        return paginated(
            search
                ? rows.filter(
                      (row) =>
                          row.name.toLowerCase().includes(search) ||
                          row.sku.toLowerCase().includes(search)
                  )
                : rows,
            query
        )
    })
    api.post(`${ADMIN}/products`, ({ body }) => {
        const product = buildProduct({
            ...(body as Partial<Product>),
            id: Math.max(0, ...rows.map((row) => row.id)) + 1,
        })
        rows.unshift(product)
        return created(product)
    })
    api.put(`${ADMIN}/products/:id`, ({ params, body }) => {
        const product = rows.find((row) => row.id === Number(params.id))!
        Object.assign(product, body)
        return ok(product)
    })

    return rows
}
