import type { Routes } from '@/@types/routes'
import authRoute from './authRoute'
import { lazy } from 'react'
import { warehousesRoutes } from '@features/warehouses'
import { locationsRoutes } from '@features/locations'
import { customersRoutes } from '@features/customers'
import { reportsRoutes } from '@features/reports'
import { salesRoutes } from '@features/sales'
import { purchasesRoutes } from '@features/purchases'
import { posRoutes } from '@features/pos'
import { unitsOfMeasureRoutes } from '@features/unitsOfMeasure'
import { productsRoutes } from '@features/products'
import { categoriesRoutes } from '@features/categories'
import { suppliersRoutes } from '@features/suppliers'
import { stockRoutes } from '@features/stock'
import { lotsRoutes } from '@features/lots'
import { serialNumbersRoutes } from '@features/serialNumbers'
import { movementsRoutes } from '@features/movements'
import { alertsRoutes } from '@features/alerts'
import { adjustmentsRoutes } from '@features/adjustments'
import { transfersRoutes } from '@features/transfers'
import { adminUsersRoutes } from '@features/admin-users'
import { invoicingRoutes } from '@features/invoicing'
import { posAdminRoutes } from '@features/posAdmin'
import { organizationRoutes } from '@features/organization'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@app/pages/HomePage')),
        authority: [],
    },
    ...productsRoutes,
    ...categoriesRoutes,
    ...unitsOfMeasureRoutes,
    ...stockRoutes,
    ...movementsRoutes,
    ...warehousesRoutes,
    ...locationsRoutes,
    ...customersRoutes,
    ...lotsRoutes,
    ...serialNumbersRoutes,
    ...adjustmentsRoutes,
    ...transfersRoutes,
    ...suppliersRoutes,
    ...purchasesRoutes,
    ...salesRoutes,
    ...reportsRoutes,
    ...alertsRoutes,
    ...posRoutes,
    ...posAdminRoutes,
    ...adminUsersRoutes,
    ...organizationRoutes,
    ...invoicingRoutes,
    {
        key: 'changePassword',
        path: '/change-password',
        component: lazy(
            () => import('@features/auth/pages/ChangePasswordPage')
        ),
        authority: [],
    },
    {
        key: 'accessDenied',
        path: '/access-denied',
        component: lazy(() => import('@features/auth/pages/AccessDeniedPage')),
        authority: [],
    },
]
