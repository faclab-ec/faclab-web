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
import { TAX_CODES } from '@/constants/tax.constant'
import {
    ADJUSTMENT_REASON_LABELS,
    ADJUSTMENT_STATUS_LABELS,
} from '@features/adjustments/model/types'
import { ALERT_TYPE_LABELS } from '@features/alerts/model/types'
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
import { PURCHASE_ORDER_STATUS_LABELS } from '@features/purchases/model/types'
import {
    PAYMENT_METHODS,
    PAYMENT_STATUS_LABELS,
    SALE_STATUS_LABELS,
} from '@features/sales/model/types'
import { SERIAL_STATUS_LABELS } from '@features/serialNumbers/model/types'
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
