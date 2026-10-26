import { ROLE, type RoleCode } from './roles.constant'

export const PERMISSION = {
    PRODUCT_READ: 'product:read',
    PRODUCT_WRITE: 'product:write',
    CATEGORY_WRITE: 'category:write',
    UOM_WRITE: 'uom:write',

    STOCK_READ: 'stock:read',
    MOVEMENT_WRITE: 'movement:write',
    WAREHOUSE_WRITE: 'warehouse:write',
    LOCATION_WRITE: 'location:write',
    LOT_WRITE: 'lot:write',
    SERIAL_WRITE: 'serial:write',
    ADJUSTMENT_WRITE: 'adjustment:write',
    TRANSFER_WRITE: 'transfer:write',
    ALERT_READ: 'alert:read',

    SALE_READ: 'sale:read',
    SALE_WRITE: 'sale:write',
    SALE_CANCEL: 'sale:cancel',

    PURCHASE_READ: 'purchase:read',
    PURCHASE_WRITE: 'purchase:write',
    PURCHASE_CONFIRM: 'purchase:confirm',
    PURCHASE_RECEIVE: 'purchase:receive',

    CUSTOMER_READ: 'customer:read',
    CUSTOMER_WRITE: 'customer:write',
    SUPPLIER_READ: 'supplier:read',
    SUPPLIER_WRITE: 'supplier:write',

    POS_OPERATE: 'pos:operate',
    REFUND_APPROVE: 'refund:approve',

    REPORT_INVENTORY_READ: 'report:inventory:read',
    REPORT_POS_READ: 'report:pos:read',

    USER_MANAGE: 'user:manage',

    ORGANIZATION_READ: 'organization:read',
    ORGANIZATION_WRITE: 'organization:write',
} as const

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION]

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSION)

/**
 * Matriz rol → permisos según auth-api-spec §2.3.
 * Úsala solo como referencia estática (tests, defaults, meta.requires).
 * En runtime la fuente de verdad es GET /api/auth/me.
 */
export const ROLE_PERMISSIONS: Record<RoleCode, Permission[]> = {
    [ROLE.ADMIN]: [...ALL_PERMISSIONS],
    [ROLE.MANAGER]: [
        PERMISSION.PRODUCT_READ,
        PERMISSION.PRODUCT_WRITE,
        PERMISSION.CATEGORY_WRITE,
        PERMISSION.UOM_WRITE,
        PERMISSION.STOCK_READ,
        PERMISSION.MOVEMENT_WRITE,
        PERMISSION.WAREHOUSE_WRITE,
        PERMISSION.LOCATION_WRITE,
        PERMISSION.LOT_WRITE,
        PERMISSION.SERIAL_WRITE,
        PERMISSION.ADJUSTMENT_WRITE,
        PERMISSION.TRANSFER_WRITE,
        PERMISSION.ALERT_READ,
        PERMISSION.SALE_READ,
        PERMISSION.SALE_WRITE,
        PERMISSION.SALE_CANCEL,
        PERMISSION.PURCHASE_READ,
        PERMISSION.PURCHASE_WRITE,
        PERMISSION.PURCHASE_CONFIRM,
        PERMISSION.PURCHASE_RECEIVE,
        PERMISSION.CUSTOMER_READ,
        PERMISSION.CUSTOMER_WRITE,
        PERMISSION.SUPPLIER_READ,
        PERMISSION.SUPPLIER_WRITE,
        PERMISSION.REFUND_APPROVE,
        PERMISSION.REPORT_INVENTORY_READ,
        PERMISSION.REPORT_POS_READ,
        PERMISSION.ORGANIZATION_READ,
    ],
    [ROLE.OPERATOR]: [
        PERMISSION.PRODUCT_READ,
        PERMISSION.PRODUCT_WRITE,
        PERMISSION.CATEGORY_WRITE,
        PERMISSION.UOM_WRITE,
        PERMISSION.STOCK_READ,
        PERMISSION.MOVEMENT_WRITE,
        PERMISSION.LOT_WRITE,
        PERMISSION.SERIAL_WRITE,
        PERMISSION.ADJUSTMENT_WRITE,
        PERMISSION.TRANSFER_WRITE,
        PERMISSION.ALERT_READ,
        PERMISSION.SALE_READ,
        PERMISSION.SALE_WRITE,
        PERMISSION.PURCHASE_READ,
        PERMISSION.PURCHASE_WRITE,
        PERMISSION.PURCHASE_RECEIVE,
        PERMISSION.CUSTOMER_READ,
        PERMISSION.CUSTOMER_WRITE,
        PERMISSION.SUPPLIER_READ,
        PERMISSION.SUPPLIER_WRITE,
        PERMISSION.REPORT_INVENTORY_READ,
        PERMISSION.ORGANIZATION_READ,
    ],
    [ROLE.VIEWER]: [
        PERMISSION.PRODUCT_READ,
        PERMISSION.STOCK_READ,
        PERMISSION.ALERT_READ,
        PERMISSION.SALE_READ,
        PERMISSION.PURCHASE_READ,
        PERMISSION.CUSTOMER_READ,
        PERMISSION.SUPPLIER_READ,
        PERMISSION.REPORT_INVENTORY_READ,
        PERMISSION.ORGANIZATION_READ,
    ],
    [ROLE.CASHIER]: [
        PERMISSION.PRODUCT_READ,
        PERMISSION.STOCK_READ,
        PERMISSION.SALE_READ,
        PERMISSION.SALE_WRITE,
        PERMISSION.CUSTOMER_READ,
        PERMISSION.CUSTOMER_WRITE,
        PERMISSION.POS_OPERATE,
        PERMISSION.REPORT_POS_READ,
    ],
}
