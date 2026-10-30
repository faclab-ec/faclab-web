import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const salesRoutes: Routes = [
    {
        key: 'sales.sales',
        path: '/sales',
        component: lazy(() => import('./pages/SalesListPage')),
        authority: ['sale:read'],
    },
    {
        key: 'sales.invoices',
        path: '/invoices',
        component: lazy(() => import('./pages/InvoicesListPage')),
        authority: ['sale:read'],
    },
    {
        key: 'sales.attention',
        path: '/sales/attention',
        component: lazy(() => import('./pages/SalesAttentionPage')),
        authority: ['sale:read'],
    },
    {
        key: 'sales.saleDetail',
        path: '/sales/:id',
        component: lazy(() => import('./pages/SaleDetailPage')),
        authority: ['sale:read'],
    },
]
