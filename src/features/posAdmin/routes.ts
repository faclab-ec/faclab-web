import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

// Back-office views of the POS: shift and refund history and reports
export const posAdminRoutes: Routes = [
    {
        key: 'posAdmin.shifts',
        path: '/shifts',
        component: lazy(() => import('./pages/ShiftsListPage')),
        authority: ['report:pos:read'],
    },
    {
        key: 'posAdmin.shiftDetail',
        path: '/shifts/:id',
        component: lazy(() => import('./pages/ShiftDetailPage')),
        authority: ['report:pos:read'],
    },
    {
        key: 'posAdmin.refunds',
        path: '/refunds',
        component: lazy(() => import('./pages/RefundsListPage')),
        authority: ['report:pos:read'],
    },
    {
        key: 'posAdmin.reports',
        path: '/reports/pos',
        component: lazy(() => import('./pages/POSReportsPage')),
        authority: ['report:pos:read'],
    },
]
