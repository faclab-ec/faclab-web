// @vitest-environment node
/**
 * Contrato front ↔ faclab-core: compara los enums del OpenAPI del backend con
 * los valores que usa el front. El backend es la fuente de verdad.
 *
 * Se salta en `npm test`. Para correrlo, con faclab-core levantado y
 * DOCS_ENABLED=true:
 *
 *   npm run check:contract
 *   OPENAPI_URL=/ruta/a/openapi.json npm run check:contract
 *
 * Importa los modelos directamente (no por el barrel) para no cargar
 * componentes ni hooks: es tooling, no código de una feature.
 */
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
    CONSTRUCTION_MATERIAL_CODES,
    TAX_CODES,
} from '@/constants/tax.constant'
import {
    ADJUSTMENT_REASON_LABELS,
    ADJUSTMENT_STATUS_LABELS,
} from '@features/adjustments/model/types'
import { ALERT_TYPE_LABELS } from '@features/alerts/model/types'
import {
    AUDIT_ACTION_LABELS,
    AUDIT_SOURCE_LABELS,
} from '@features/audit-log/model/types'
import {
    IMPORT_KINDS,
    IMPORT_MODES,
    IMPORT_ROW_ACTIONS,
    IMPORT_STATUSES,
} from '@features/imports/model/types'
import {
    INTEGRATION_CLIENT_STATUSES,
    INTEGRATION_ENVIRONMENTS,
    SCOPES,
    WEBHOOK_DELIVERY_STATUSES,
    WEBHOOK_DISABLED_REASONS,
    WEBHOOK_ENDPOINT_STATUSES,
    WEBHOOK_EVENT_TYPES,
} from '@features/integrations/model/types'
import { CREDIT_NOTE_STATUS_LABELS } from '@features/invoicing/model/types'
import { LOCATION_TYPES } from '@features/locations/model/types'
import { MOVEMENT_TYPES } from '@features/movements/model/types'
import {
    CASH_MOVEMENT_TYPE_LABELS,
    POS_PAYMENT_METHODS,
    POS_PAYMENT_STATUS_LABELS,
    POS_SALE_STATUS_LABELS,
    REFUND_STATUS_LABELS,
    SHIFT_STATUS_LABELS,
} from '@features/pos/model/types'
import {
    PAYABLE_APPLICATION_KINDS,
    PAYABLE_STATUSES,
} from '@features/payables/model/types'
import {
    PURCHASE_ORDER_STATUS_LABELS,
    SUPPLIER_RETURN_STATUSES,
} from '@features/purchases/model/types'
import { QUOTE_STATUS_LABELS } from '@features/quotes/model/types'
import {
    RECEIVABLE_APPLICATION_KINDS,
    RECEIVABLE_STATUSES,
} from '@features/receivables/model/types'
import {
    DISCREPANCY_KIND_LABELS,
    DISCREPANCY_STATUS_LABELS,
    PAYMENT_METHODS,
    PAYMENT_STATUS_LABELS,
    SALE_INVOICE_STATUSES,
    SALE_STATUS_LABELS,
} from '@features/sales/model/types'
import { SERIAL_STATUS_LABELS } from '@features/serialNumbers/model/types'
import {
    PLAN_RESOURCES,
    SUBSCRIPTION_STATUSES,
} from '@features/subscription/model/types'
import { TRANSFER_STATUS_LABELS } from '@features/transfers/model/types'

const OPENAPI_URL = process.env.OPENAPI_URL

const keys = (record: Record<string, unknown>) => Object.keys(record)

/** [schema del OpenAPI, nombre en el front, valores del front] */
const FRONT_ENUMS: [string, string, readonly string[]][] = [
    ['PaymentMethod', 'PAYMENT_METHODS', PAYMENT_METHODS],
    ['PaymentMethod', 'POS_PAYMENT_METHODS', POS_PAYMENT_METHODS],
    ['LocationType', 'LOCATION_TYPES', LOCATION_TYPES],
    ['MovementType', 'MOVEMENT_TYPES', MOVEMENT_TYPES],
    ['TaxCode', 'TAX_CODES', TAX_CODES],
    [
        'ConstructionMaterialCode',
        'CONSTRUCTION_MATERIAL_CODES',
        CONSTRUCTION_MATERIAL_CODES,
    ],
    ['SaleStatus', 'SALE_STATUS_LABELS', keys(SALE_STATUS_LABELS)],
    ['SaleStatus', 'POS_SALE_STATUS_LABELS', keys(POS_SALE_STATUS_LABELS)],
    ['PaymentStatus', 'PAYMENT_STATUS_LABELS', keys(PAYMENT_STATUS_LABELS)],
    [
        'PaymentStatus',
        'POS_PAYMENT_STATUS_LABELS',
        keys(POS_PAYMENT_STATUS_LABELS),
    ],
    ['ShiftStatus', 'SHIFT_STATUS_LABELS', keys(SHIFT_STATUS_LABELS)],
    [
        'CashMovementType',
        'CASH_MOVEMENT_TYPE_LABELS',
        keys(CASH_MOVEMENT_TYPE_LABELS),
    ],
    ['RefundStatus', 'REFUND_STATUS_LABELS', keys(REFUND_STATUS_LABELS)],
    [
        'PurchaseOrderStatus',
        'PURCHASE_ORDER_STATUS_LABELS',
        keys(PURCHASE_ORDER_STATUS_LABELS),
    ],
    [
        'AdjustmentStatus',
        'ADJUSTMENT_STATUS_LABELS',
        keys(ADJUSTMENT_STATUS_LABELS),
    ],
    [
        'AdjustmentReason',
        'ADJUSTMENT_REASON_LABELS',
        keys(ADJUSTMENT_REASON_LABELS),
    ],
    ['TransferStatus', 'TRANSFER_STATUS_LABELS', keys(TRANSFER_STATUS_LABELS)],
    ['SerialStatus', 'SERIAL_STATUS_LABELS', keys(SERIAL_STATUS_LABELS)],
    ['AlertType', 'ALERT_TYPE_LABELS', keys(ALERT_TYPE_LABELS)],
    ['AuditAction', 'AUDIT_ACTION_LABELS', keys(AUDIT_ACTION_LABELS)],
    ['InvoiceStatus', 'SALE_INVOICE_STATUSES', SALE_INVOICE_STATUSES],
    [
        'CreditNoteStatus',
        'CREDIT_NOTE_STATUS_LABELS',
        keys(CREDIT_NOTE_STATUS_LABELS),
    ],
    [
        'DiscrepancyKind',
        'DISCREPANCY_KIND_LABELS',
        keys(DISCREPANCY_KIND_LABELS),
    ],
    [
        'DiscrepancyStatus',
        'DISCREPANCY_STATUS_LABELS',
        keys(DISCREPANCY_STATUS_LABELS),
    ],
    ['TenantSource', 'AUDIT_SOURCE_LABELS', keys(AUDIT_SOURCE_LABELS)],
    ['QuoteStatus', 'QUOTE_STATUS_LABELS', keys(QUOTE_STATUS_LABELS)],
    ['ReceivableStatus', 'RECEIVABLE_STATUSES', RECEIVABLE_STATUSES],
    [
        'ReceivableApplicationKind',
        'RECEIVABLE_APPLICATION_KINDS',
        RECEIVABLE_APPLICATION_KINDS,
    ],
    [
        'SupplierReturnStatus',
        'SUPPLIER_RETURN_STATUSES',
        SUPPLIER_RETURN_STATUSES,
    ],
    ['PayableStatus', 'PAYABLE_STATUSES', PAYABLE_STATUSES],
    [
        'PayableApplicationKind',
        'PAYABLE_APPLICATION_KINDS',
        PAYABLE_APPLICATION_KINDS,
    ],
    ['ImportKind', 'IMPORT_KINDS', IMPORT_KINDS],
    ['ImportMode', 'IMPORT_MODES', IMPORT_MODES],
    ['ImportStatus', 'IMPORT_STATUSES', IMPORT_STATUSES],
    ['ImportRowAction', 'IMPORT_ROW_ACTIONS', IMPORT_ROW_ACTIONS],
    ['Scope', 'SCOPES', SCOPES],
    [
        'IntegrationClientStatus',
        'INTEGRATION_CLIENT_STATUSES',
        INTEGRATION_CLIENT_STATUSES,
    ],
    [
        'IntegrationEnvironment',
        'INTEGRATION_ENVIRONMENTS',
        INTEGRATION_ENVIRONMENTS,
    ],
    ['WebhookEventType', 'WEBHOOK_EVENT_TYPES', WEBHOOK_EVENT_TYPES],
    [
        'WebhookEndpointStatus',
        'WEBHOOK_ENDPOINT_STATUSES',
        WEBHOOK_ENDPOINT_STATUSES,
    ],
    [
        'WebhookDeliveryStatus',
        'WEBHOOK_DELIVERY_STATUSES',
        WEBHOOK_DELIVERY_STATUSES,
    ],
    ['DisabledReason', 'WEBHOOK_DISABLED_REASONS', WEBHOOK_DISABLED_REASONS],
    ['SubscriptionStatus', 'SUBSCRIPTION_STATUSES', SUBSCRIPTION_STATUSES],
    ['PlanResource', 'PLAN_RESOURCES', PLAN_RESOURCES],
]

/** Valores del backend que el front puede ignorar, con el motivo */
const IGNORED_BACKEND_VALUES: Record<string, string[]> = {
    // faclab-core define AlertType.EXPIRED pero ninguna consulta lo emite
    AlertType: ['expired'],
}

type OpenApiSpec = {
    components: { schemas: Record<string, { enum?: string[] }> }
}

async function loadSpec(source: string): Promise<OpenApiSpec> {
    if (/^https?:\/\//.test(source)) {
        const response = await fetch(source)
        if (!response.ok) {
            throw new Error(`GET ${source} → ${response.status}`)
        }
        return (await response.json()) as OpenApiSpec
    }
    return JSON.parse(await readFile(source, 'utf8')) as OpenApiSpec
}

describe.skipIf(!OPENAPI_URL)('API contract with faclab-core', async () => {
    const spec = OPENAPI_URL ? await loadSpec(OPENAPI_URL) : null
    const schemas = spec?.components.schemas ?? {}

    it.each(FRONT_ENUMS)('%s matches %s', (schema, _name, frontValues) => {
        const backValues = schemas[schema]?.enum
        expect(backValues, `schema ${schema} not in OpenAPI`).toBeDefined()

        const ignored = IGNORED_BACKEND_VALUES[schema] ?? []
        const expected = (backValues ?? []).filter((v) => !ignored.includes(v))
        expect([...frontValues].sort()).toEqual([...expected].sort())
    })
})
