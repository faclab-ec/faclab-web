import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

// Todo el portal es `integration:manage` (solo ADMIN): quitar el permiso lo
// oculta entero
const AUTHORITY = ['integration:manage']

export const integrationsRoutes: Routes = [
    {
        key: 'settings.integrations',
        path: '/settings/integrations',
        component: lazy(() => import('./pages/IntegrationClientsPage')),
        authority: AUTHORITY,
    },
    {
        key: 'settings.integrationDetail',
        path: '/settings/integrations/:id',
        component: lazy(() => import('./pages/IntegrationClientDetailPage')),
        authority: AUTHORITY,
    },
    {
        key: 'settings.webhooks',
        path: '/settings/webhooks',
        component: lazy(() => import('./pages/WebhookEndpointsPage')),
        authority: AUTHORITY,
    },
    {
        key: 'settings.webhookDetail',
        path: '/settings/webhooks/:id',
        component: lazy(() => import('./pages/WebhookEndpointDetailPage')),
        authority: AUTHORITY,
    },
]
