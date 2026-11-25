import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const subscriptionRoutes: Routes = [
    {
        key: 'settings.subscription',
        path: '/settings/subscription',
        component: lazy(() => import('./pages/SubscriptionPage')),
        authority: ['organization:read'],
    },
]
