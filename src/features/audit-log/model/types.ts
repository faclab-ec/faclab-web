// Bitácora de auditoría de faclab-core (S3.5): GET /api/admin/audit-log

// Catálogo de acciones auditadas, `<recurso>.<verbo>` (AuditAction del core)
export const AUDIT_ACTION_LABELS = {
    'product.created': 'Producto creado',
    'product.updated': 'Producto modificado',
    'product.price_changed': 'Precio cambiado',
    'product.deleted': 'Producto eliminado',
    'movement.created': 'Movimiento manual',
    'adjustment.confirmed': 'Ajuste confirmado',
    'adjustment.cancelled': 'Ajuste cancelado',
    'transfer.confirmed': 'Transferencia confirmada',
    'transfer.received': 'Transferencia recibida',
    'transfer.cancelled': 'Transferencia cancelada',
    'sale.cancelled': 'Venta anulada',
    'sale.price_overridden': 'Precio de venta cambiado',
    'sale.discount_applied': 'Descuento aplicado',
    'refund.processed': 'Devolución aprobada',
    'refund.cancelled': 'Devolución cancelada',
    'cash_movement.registered': 'Movimiento de caja',
    'shift.opened': 'Turno abierto',
    'shift.closed': 'Turno cerrado',
    'user.created': 'Usuario creado',
    'user.role_changed': 'Rol cambiado',
    'user.branches_changed': 'Sucursales del usuario',
    'user.renamed': 'Nombre cambiado',
    'user.activated': 'Usuario activado',
    'user.deactivated': 'Usuario desactivado',
    'user.password_reset': 'Contraseña restablecida',
    'branch.created': 'Sucursal creada',
    'branch.updated': 'Sucursal modificada',
    'branch.deleted': 'Sucursal eliminada',
    'emission_point.created': 'Punto de emisión creado',
    'emission_point.updated': 'Punto de emisión modificado',
    'emission_point.deleted': 'Punto de emisión eliminado',
    'pos_terminal.created': 'Terminal creada',
    'pos_terminal.updated': 'Terminal modificada',
    'pos_terminal.deleted': 'Terminal eliminada',
} as const

export type AuditAction = keyof typeof AUDIT_ACTION_LABELS

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]

// El recurso es el prefijo de la acción
export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
    product: 'Producto',
    movement: 'Movimiento',
    adjustment: 'Ajuste',
    transfer: 'Transferencia',
    sale: 'Venta',
    refund: 'Devolución',
    cash_movement: 'Movimiento de caja',
    shift: 'Turno',
    user: 'Usuario',
    branch: 'Sucursal',
    emission_point: 'Punto de emisión',
    pos_terminal: 'Terminal',
}

export type AuditSource = 'request' | 'message' | 'task'

export const AUDIT_SOURCE_LABELS: Record<AuditSource, string> = {
    request: 'Usuario',
    message: 'Mensaje',
    task: 'Tarea',
}

export type AuditValues = Record<string, unknown>

export interface AuditEntry {
    id: number
    occurredAt: string
    actorUserId: number | null
    actorName: string | null
    action: AuditAction
    resourceType: string
    resourceId: number | null
    branchId: number | null
    source: AuditSource
    requestId: string | null
    // Solo los campos relevantes, con las claves del core (snake_case)
    before: AuditValues | null
    after: AuditValues | null
}

export interface AuditLogParams {
    limit?: number
    offset?: number
    fromDate?: string
    toDate?: string
    actorId?: number
    action?: AuditAction
    resourceType?: string
    resourceId?: number
    branchId?: number
}

const FIELD_LABELS: Record<string, string> = {
    sku: 'SKU',
    name: 'Nombre',
    description: 'Descripción',
    barcode: 'Código de barras',
    purchase_price: 'Costo',
    sale_price: 'Precio de venta',
    tax_code: 'IVA',
    is_active: 'Activo',
    active: 'Activo',
    status: 'Estado',
    reason: 'Motivo',
    total: 'Total',
    quantity: 'Cantidad',
    type: 'Tipo',
    amount: 'Monto',
    product_id: 'Producto',
    location_id: 'Ubicación',
    warehouse_id: 'Bodega',
    source_location_id: 'Ubicación de origen',
    destination_location_id: 'Ubicación de destino',
    items: 'Ítems',
    item_id: 'Ítem',
    unit_price: 'Precio unitario',
    discount_type: 'Tipo de descuento',
    discount_value: 'Valor del descuento',
    discount: 'Descuento',
    number: 'Número',
    original_sale_id: 'Venta original',
    payments: 'Pagos',
    shift_id: 'Turno',
    terminal_id: 'Terminal',
    opening_balance: 'Fondo inicial',
    closing_balance: 'Efectivo contado',
    expected_balance: 'Efectivo esperado',
    discrepancy: 'Diferencia',
    username: 'Usuario',
    full_name: 'Nombre completo',
    role: 'Rol',
    branch_ids: 'Sucursales',
    establishment_code: 'Establecimiento',
    address: 'Dirección',
    code: 'Código',
    emission_point_id: 'Punto de emisión',
    default_location_id: 'Ubicación de venta',
}

export const fieldLabel = (field: string): string =>
    FIELD_LABELS[field] ?? field

export interface AuditChange {
    field: string
    label: string
    before: unknown
    after: unknown
    changed: boolean
}

/** Los campos de la entrada, en el orden en que llegan: primero los de
 *  `before`, luego los que solo trae `after` */
export function auditChanges(
    entry: Pick<AuditEntry, 'before' | 'after'>
): AuditChange[] {
    const before = entry.before ?? {}
    const after = entry.after ?? {}
    const fields = [
        ...Object.keys(before),
        ...Object.keys(after).filter((field) => !(field in before)),
    ]
    return fields.map((field) => ({
        field,
        label: fieldLabel(field),
        before: before[field],
        after: after[field],
        changed: JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    }))
}

/** Un valor de la bitácora como texto: listas y objetos en JSON */
export function formatAuditValue(value: unknown): string {
    if (value === undefined || value === null || value === '') return '—'
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}
