import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const organizationRoutes: Routes = [
    {
        key: 'settings.branches',
        path: '/settings/branches',
        component: lazy(() => import('./pages/BranchesPage')),
        authority: ['organization:read'],
    },
    {
        key: 'settings.branchDetail',
        path: '/settings/branches/:id',
        component: lazy(() => import('./pages/BranchDetailPage')),
        authority: ['organization:read'],
    },
]
