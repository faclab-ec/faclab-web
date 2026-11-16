import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const importsRoutes: Routes = [
    {
        key: 'settings.imports',
        path: '/settings/imports',
        component: lazy(() => import('./pages/ImportsPage')),
        authority: ['import:write'],
    },
    {
        key: 'settings.importDetail',
        path: '/settings/imports/:id',
        component: lazy(() => import('./pages/ImportDetailPage')),
        authority: ['import:write'],
    },
]
