import {
    ADMIN,
    INVOICING,
    POS,
    apiError,
    ok,
    paginated,
    type MockApi,
} from '../support/mockApi'
import { emptyDailyReport, emptyDashboard, emptyValuation } from './dashboard'

const EMPTY_ADMIN_LISTS = [
    'categories',
    'products',
    'units-of-measure',
    'stock',
    'movements',
    'warehouses',
    'locations',
    'lots',
    'serials',
    'adjustments',
    'transfers',
    'customers',
    'sales',
    'invoice-discrepancies',
    'suppliers',
    'purchase-orders',
    'users',
    'audit-log',
    'branches',
    'emission-points',
    'pos-terminals',
    'alerts/low-stock',
    'alerts/out-of-stock',
    'alerts/reorder-point',
    'alerts/expiring-lots',
]

/**
 * Backend recién instalado: cada pantalla del menú recibe una respuesta válida
 * y vacía. Sirve de base a las pruebas de humo y de navegación; las pruebas
 * de un módulo registran después sus propios datos (gana el último handler).
 */
export const mockEmptyBackend = (api: MockApi): void => {
    for (const resource of EMPTY_ADMIN_LISTS) {
        api.get(`${ADMIN}/${resource}`, ({ query }) => paginated([], query))
    }
    api.get(`${ADMIN}/dashboard`, () => ok(emptyDashboard()))
    api.get(`${ADMIN}/reports/inventory/valuation`, () => ok(emptyValuation()))

    api.get(`${POS}/shifts`, ({ query }) => paginated([], query))
    api.get(`${POS}/refunds`, ({ query }) => paginated([], query))
    api.get(`${POS}/reports/daily`, () => ok(emptyDailyReport()))
    // Sucursal sin cajas: el POS lo dice en vez de pedir el turno
    api.get(`${POS}/terminals`, () => ok([]))

    api.get(`${INVOICING}/invoices`, () => ok([]))
    api.get(`${INVOICING}/certificates`, () => ok([]))
    api.get(`${INVOICING}/sequences`, () => ok([]))
    // faclab-invoicing responde 404 mientras la empresa no esté configurada
    api.get(`${INVOICING}/company-config`, () =>
        apiError(404, 'NOT_FOUND', 'Company config not found')
    )
}
