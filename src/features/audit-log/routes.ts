import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const auditLogRoutes: Routes = [
    {
        key: 'settings.auditLog',
        path: '/settings/audit-log',
        component: lazy(() => import('./pages/AuditLogPage')),
        authority: ['audit:read'],
    },
]
