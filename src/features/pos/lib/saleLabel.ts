/** Una venta por su número de sucursal (`V-001-000123`) o, sin él, por su id. */
export const saleLabel = (sale: { id: number; number: string | null }) =>
    sale.number ?? `#${sale.id}`
